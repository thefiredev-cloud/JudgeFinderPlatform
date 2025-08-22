/**
 * Manual Judge Sync Script
 * Syncs California judges from CourtListener API
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function syncJudges() {
  console.log('Starting California judges sync...')
  
  try {
    // Use existing sync script
    const syncScript = require('./sync-courtlistener-judges.js')
    const service = new syncScript.CourtListenerJudgesSyncService()
    
    // Filter for California judges
    const results = await service.syncJudges({
      state: 'CA',
      limit: 2000 // Get all CA judges
    })
    
    console.log('✅ Judge sync completed:', results)
    return results
  } catch (error) {
    console.error('❌ Judge sync failed:', error)
    
    // Fallback: Check if we already have judges in database
    const { data: judges, error: dbError } = await supabase
      .from('judges')
      .select('id, name, jurisdiction')
      .eq('jurisdiction', 'CA')
      .limit(10)
    
    if (judges && judges.length > 0) {
      console.log(`Found ${judges.length} CA judges already in database`)
      console.log('Sample judges:', judges.slice(0, 3))
      
      // Get total count
      const { count } = await supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })
        .eq('jurisdiction', 'CA')
      
      console.log(`Total CA judges in database: ${count}`)
      return { existingJudges: count }
    }
    
    throw error
  }
}

// Export for use in other scripts
module.exports = { syncJudges }

// Run if called directly
if (require.main === module) {
  syncJudges()
    .then(() => {
      console.log('✅ Sync completed successfully')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Sync failed:', error)
      process.exit(1)
    })
}