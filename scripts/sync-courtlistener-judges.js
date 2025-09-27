'use strict'

// Load environment
require('dotenv').config({ path: '.env.local' })

// Enable TS imports and path aliases for the library code
const path = require('path')
process.env.TS_NODE_PROJECT = process.env.TS_NODE_PROJECT || path.resolve(__dirname, '../tsconfig.json')
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'commonjs',
  moduleResolution: 'node',
  esModuleInterop: true,
  resolveJsonModule: true,
  baseUrl: path.resolve(__dirname, '..'),
  paths: {
    '@/*': ['*'],
  },
})

require('ts-node/register')
require('tsconfig-paths/register')
const moduleAlias = require('module-alias')
moduleAlias.addAlias('@', path.resolve(__dirname, '..'))

// Import the existing JudgeSyncManager from the TypeScript implementation
// Using absolute resolution to avoid CJS/ESM interop issues
const { JudgeSyncManager } = require(path.resolve(__dirname, '../lib/sync/judge-sync.ts'))

class CourtListenerJudgesSyncService {
  async syncJudges(options = {}) {
    const manager = new JudgeSyncManager()
    return await manager.syncJudges({
      jurisdiction: options.state || 'CA',
      batchSize: options.batchSize || Number(process.env.BATCH_SIZE) || 10,
      forceRefresh: Boolean(options.forceRefresh ?? (process.env.FORCE_REFRESH === 'true')),
      judgeIds: options.judgeIds,
      discoverLimit: options.limit || Number(process.env.DISCOVER_LIMIT) || 500,
    })
  }
}

module.exports = { CourtListenerJudgesSyncService }


