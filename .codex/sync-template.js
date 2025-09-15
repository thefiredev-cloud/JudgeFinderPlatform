/**
 * Sync Script Template
 * Usage: copy to scripts/NAME.js and implement main()
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.warn('[%%SCRIPT_NAME%%] Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  console.log(`[%%SCRIPT_NAME%%] Starting...`)

  try {
    // TODO: Replace with actual sync logic
    const { data, error } = await supabase
      .from('judges')
      .select('id')
      .limit(1)

    if (error) throw error

    console.log(`[%%SCRIPT_NAME%%] OK. Sample query result:`, data)
    console.log(`[%%SCRIPT_NAME%%] Completed`)
  } catch (err) {
    console.error(`[%%SCRIPT_NAME%%] Failed:`, err)
    process.exit(1)
  }
}

module.exports = { main }

if (require.main === module) {
  main()
}

