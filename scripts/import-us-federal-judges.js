#!/usr/bin/env node

const fetch = require('node-fetch')
require('dotenv').config({ path: '.env.local' })

async function runFederalBackfill() {
  const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const apiKey = process.env.SYNC_API_KEY

  if (!apiKey) {
    console.error('SYNC_API_KEY is required in environment to call the sync API')
    process.exit(1)
  }

  const maxLoops = Number(process.env.FEDERAL_BACKFILL_LOOPS || 20)
  const batchSize = Number(process.env.FEDERAL_BACKFILL_BATCH || 20)
  const discoverLimit = Number(process.env.FEDERAL_DISCOVER_LIMIT || 500)

  console.log(`Starting federal judges backfill against ${baseUrl}`)

  let loops = 0
  let totalCreated = 0
  let totalProcessed = 0
  let totalUpdated = 0
  let totalEnhanced = 0

  while (loops < maxLoops) {
    loops++
    console.log(`\nLoop ${loops}/${maxLoops} → POST /api/sync/judges { jurisdiction: 'US' }`)

    const res = await fetch(`${baseUrl}/api/sync/judges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        batchSize,
        jurisdiction: 'US',
        forceRefresh: false,
        discoverLimit
      })
    })

    const text = await res.text()
    if (!res.ok) {
      console.error(`Sync API returned ${res.status}: ${text}`)
      break
    }

    let payload
    try { payload = JSON.parse(text) } catch (e) { payload = null }
    if (!payload || !payload.data) {
      console.error('Unexpected response:', text)
      break
    }

    const { judgesProcessed, judgesUpdated, judgesCreated, profilesEnhanced } = payload.data
    totalProcessed += judgesProcessed || 0
    totalUpdated += judgesUpdated || 0
    totalCreated += judgesCreated || 0
    totalEnhanced += profilesEnhanced || 0

    console.log(`Processed: ${judgesProcessed}, Created: ${judgesCreated}, Updated: ${judgesUpdated}, Enhanced: ${profilesEnhanced}`)

    // Heuristic stop: if nothing was created and processed is small, assume no more new IDs this pass
    if ((judgesCreated || 0) === 0 && (judgesProcessed || 0) < batchSize) {
      console.log('No new judges created and small batch processed; ending backfill.')
      break
    }

    // Small pause between loops to respect CourtListener rate limits
    await new Promise(r => setTimeout(r, 1500))
  }

  console.log('\nFederal backfill complete:')
  console.log({ totalProcessed, totalCreated, totalUpdated, totalEnhanced })
}

runFederalBackfill().catch(err => {
  console.error('Federal backfill failed:', err)
  process.exit(1)
})
