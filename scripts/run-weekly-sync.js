/**
 * Weekly Sync Runner
 * Queues weekly court + judge + decision backfill jobs with schedules.
 * Fallback runs manual court/judge syncs if queueing isn't available.
 */

require('dotenv').config({ path: '.env.local' })

async function queueWeeklyJobs() {
  const { SyncQueueManager } = require('../lib/sync/queue-manager')
  const qm = new SyncQueueManager()
  const now = Date.now()

  const courtJobId = await qm.addJob(
    'court',
    { batchSize: 30, jurisdiction: 'CA', forceRefresh: true },
    200,
    new Date(now)
  )

  const judgeJobId = await qm.addJob(
    'judge',
    { batchSize: 15, jurisdiction: 'CA', forceRefresh: true },
    150,
    new Date(now + 30 * 60 * 1000)
  )

  const decisionJobId = await qm.addJob(
    'decision',
    { batchSize: 3, jurisdiction: 'CA', daysSinceLast: 7, maxDecisionsPerJudge: 100 },
    100,
    new Date(now + 60 * 60 * 1000)
  )

  qm.startProcessing(30000)
  console.log('Queued weekly jobs:', { courtJobId, judgeJobId, decisionJobId })
  return { courtJobId, judgeJobId, decisionJobId }
}

async function fallbackManual() {
  console.log('Queueing failed, running manual court/judge sync fallback...')
  const { syncCourts } = require('./sync-courts-manual')
  const { syncJudges } = require('./sync-judges-manual')
  await syncCourts()
  await syncJudges()
}

async function run() {
  try {
    await queueWeeklyJobs()
    console.log('Weekly sync queued successfully.')
  } catch (e) {
    console.warn('Queue mode failed:', e.message)
    await fallbackManual()
  }
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
}

module.exports = { run }

