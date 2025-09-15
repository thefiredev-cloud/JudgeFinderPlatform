/**
 * Daily Sync Runner
 * Queues or runs the daily sync workflow (decisions + judges) safely.
 *
 * Strategy:
 * - Prefer queueing via SyncQueueManager (does not require API secrets)
 * - If queue insert fails (schema mismatch), fallback to running manual judge sync only.
 */

require('dotenv').config({ path: '.env.local' })

async function queueDailyJobs() {
  const { SyncQueueManager } = require('../lib/sync/queue-manager')
  const qm = new SyncQueueManager()
  const jobs = []
  // Decision job — conservative options
  const decisionJobId = await qm.addJob(
    'decision',
    { batchSize: 3, jurisdiction: 'CA', daysSinceLast: 1, maxDecisionsPerJudge: 20 },
    100
  )
  jobs.push(decisionJobId)
  // Judge job — refresh stale profiles
  const judgeJobId = await qm.addJob(
    'judge',
    { batchSize: 20, jurisdiction: 'CA', forceRefresh: false },
    50
  )
  jobs.push(judgeJobId)
  // start processing loop
  qm.startProcessing(30000)
  console.log('Queued daily jobs:', jobs)
  return jobs
}

async function fallbackManual() {
  console.log('Queueing failed, running manual judge sync fallback...')
  const { syncJudges } = require('./sync-judges-manual')
  return syncJudges()
}

async function run() {
  try {
    await queueDailyJobs()
    console.log('Daily sync queued successfully.')
  } catch (e) {
    console.warn('Queue mode failed:', e.message)
    await fallbackManual()
  }
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
}

module.exports = { run }

