/**
 * Run Bias Analysis Script
 * Generates or refreshes analytics for California judges in small batches.
 *
 * Usage:
 *   node scripts/run-bias-analysis.js [limit=25]
 *
 * Notes:
 * - Uses the public API endpoint to generate analytics and relies on server-side caching.
 * - Defaults to production base URL when NODE_ENV=production; otherwise uses localhost:3005.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runBiasAnalysis(limit = 25) {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? (process.env.NEXT_PUBLIC_SITE_URL || 'https://judgefinder.io')
    : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3005')

  console.log(`Starting bias analysis for up to ${limit} CA judges...`)

  const { data: judges, error } = await supabase
    .from('judges')
    .select('id, name, total_cases')
    .eq('jurisdiction', 'CA')
    .order('total_cases', { ascending: false })
    .limit(limit)

  if (error) throw error

  let success = 0, skipped = 0, failed = 0

  for (const judge of judges) {
    try {
      const url = `${baseUrl}/api/judges/${judge.id}/analytics`
      const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json?.analytics) {
        console.log(`✓ ${judge.name}: ${json.analytics.total_cases_analyzed} cases, ${json.analytics.overall_confidence}% confidence`)
        success++
      } else {
        console.log(`- ${judge.name}: no analytics returned (cached=${json?.cached})`)
        skipped++
      }
      // small delay to be polite
      await new Promise(r => setTimeout(r, 200))
    } catch (e) {
      console.error(`× ${judge.name}: ${e.message}`)
      failed++
    }
  }

  console.log(`\nSummary: success=${success}, skipped=${skipped}, failed=${failed}`)
  return { success, skipped, failed }
}

if (require.main === module) {
  const arg = process.argv[2]
  const limit = arg && !Number.isNaN(Number(arg)) ? Number(arg) : 25
  runBiasAnalysis(limit)
    .then(() => process.exit(0))
    .catch((err) => { console.error('Bias analysis run failed:', err); process.exit(1) })
}

module.exports = { runBiasAnalysis }

