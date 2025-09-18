/**
 * Netlify Background Function: Batch Generate Analytics
 * Triggers GET /api/judges/:id/analytics for CA judges with cases.
 * Uses Netlify production environment variables.
 */

const { createClient } = require('@supabase/supabase-js')

exports.handler = async function(event, context) {
  const start = Date.now()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || ''

  if (!siteUrl) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing NEXT_PUBLIC_SITE_URL/URL' })
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing Supabase env variables' })
    }
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Fetch CA judges with cases
  const { data: judges, error } = await supabase
    .from('judges')
    .select('id, name, total_cases')
    .eq('jurisdiction', 'CA')
    .gt('total_cases', 0)
    .order('name')

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to fetch judges: ${error.message}` })
    }
  }

  const batchSize = 8
  let success = 0
  let failed = 0

  for (let i = 0; i < judges.length; i += batchSize) {
    const batch = judges.slice(i, i + batchSize)
    // Fire requests concurrently with small timeout
    const results = await Promise.allSettled(
      batch.map(j => fetch(`${siteUrl}/api/judges/${j.id}/analytics`, { method: 'GET' }))
    )
    results.forEach(r => (r.status === 'fulfilled' && r.value.ok ? success++ : failed++))
    // Brief pacing to be kind to runtime
    await new Promise(res => setTimeout(res, 500))
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success,
      failed,
      total: success + failed,
      durationMs: Date.now() - start
    })
  }
}


