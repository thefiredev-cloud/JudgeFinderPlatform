/**
 * Manual Decisions Sync Script
 * Invokes the enhanced DecisionSyncManager to ingest real CourtListener data
 */

const path = require('path')

process.env.TS_NODE_PROJECT = process.env.TS_NODE_PROJECT || path.resolve(__dirname, '../tsconfig.json')
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'commonjs',
  moduleResolution: 'node',
  esModuleInterop: true,
  resolveJsonModule: true,
  baseUrl: path.resolve(__dirname, '..'),
  paths: {
    '@/*': ['*']
  }
})

require('dotenv').config({ path: '.env.local' })
require('ts-node/register')
require('tsconfig-paths/register')
const moduleAlias = require('module-alias')
moduleAlias.addAlias('@', path.resolve(__dirname, '..'))

const { DecisionSyncManager } = require('../lib/sync/decision-sync')

async function syncDecisions() {
  console.log('Starting decision & docket sync via DecisionSyncManager...')

  const manager = new DecisionSyncManager()
  const result = await manager.syncDecisions({
    jurisdiction: 'CA',
    batchSize: 5,
    maxDecisionsPerJudge: 150,
    maxFilingsPerJudge: 200,
    includeDockets: true,
    yearsBack: 5,
    filingYearsBack: 5
  })

  console.log('\n📊 Sync Results:')
  console.log(JSON.stringify(result, null, 2))

  if (!result.success) {
    throw new Error('Decision sync completed with errors')
  }

  return result
}

module.exports = { syncDecisions }

if (require.main === module) {
  syncDecisions()
    .then(() => {
      console.log('✅ Decisions sync completed successfully')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Decisions sync failed:', error)
      process.exit(1)
    })
}
