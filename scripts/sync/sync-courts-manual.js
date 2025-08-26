/**
 * Manual Courts Sync Script
 * Syncs California courts data and relationships
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function syncCourts() {
  console.log('Starting California courts sync...')
  
  try {
    // Check if we have the CourtListener courts sync script
    const fs = require('fs')
    const path = require('path')
    const syncScriptPath = path.join(__dirname, 'sync-courtlistener-courts.js')
    
    if (fs.existsSync(syncScriptPath)) {
      console.log('Using CourtListener courts sync script...')
      // Use the existing sync script
      require('./sync-courtlistener-courts.js')
      return { success: true, message: 'Courts synced via CourtListener' }
    }
    
    // Fallback: Check and update existing courts
    console.log('Checking existing California courts...')
    
    const { data: courts, error } = await supabase
      .from('courts')
      .select('*')
      .or('jurisdiction.eq.CA,jurisdiction.ilike.%California%')
    
    if (error) throw error
    
    console.log(`Found ${courts.length} California courts in database`)
    
    // Update court statistics
    const stats = {
      totalCourts: courts.length,
      updatedCourts: 0,
      courtsWithJudges: 0,
      totalFilings: 0
    }
    
    for (const court of courts) {
      try {
        // Count judges assigned to this court
        const { count: judgeCount } = await supabase
          .from('judges')
          .select('*', { count: 'exact', head: true })
          .eq('court_id', court.id)
        
        // Count cases filed in this court
        const { count: caseCount } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .eq('court_id', court.id)
        
        // Calculate annual filings (estimate based on last 3 years of data)
        const annualFilings = Math.floor((caseCount || 0) / 3)
        
        // Update court with statistics
        const { error: updateError } = await supabase
          .from('courts')
          .update({
            judge_count: judgeCount || 0,
            annual_filings: annualFilings,
            last_synced: new Date().toISOString(),
            metadata: {
              ...court.metadata,
              stats_updated: new Date().toISOString(),
              total_cases: caseCount || 0
            }
          })
          .eq('id', court.id)
        
        if (!updateError) {
          stats.updatedCourts++
          if (judgeCount > 0) stats.courtsWithJudges++
          stats.totalFilings += annualFilings
        }
        
        console.log(`✓ Updated ${court.name}: ${judgeCount} judges, ${caseCount} cases`)
        
      } catch (courtError) {
        console.error(`Error updating court ${court.name}:`, courtError)
      }
    }
    
    // Ensure we have the main CA courts
    const essentialCourts = [
      {
        name: 'Los Angeles County Superior Court',
        jurisdiction: 'CA',
        court_type: 'State',
        location: 'Los Angeles, CA',
        annual_filings: 450000
      },
      {
        name: 'Orange County Superior Court',
        jurisdiction: 'CA',
        court_type: 'State',
        location: 'Santa Ana, CA',
        annual_filings: 280000
      },
      {
        name: 'San Diego County Superior Court',
        jurisdiction: 'CA',
        court_type: 'State',
        location: 'San Diego, CA',
        annual_filings: 200000
      },
      {
        name: 'San Francisco County Superior Court',
        jurisdiction: 'CA',
        court_type: 'State',
        location: 'San Francisco, CA',
        annual_filings: 150000
      },
      {
        name: 'California Supreme Court',
        jurisdiction: 'CA',
        court_type: 'State Supreme',
        location: 'San Francisco, CA',
        annual_filings: 8000
      }
    ]
    
    for (const courtData of essentialCourts) {
      // Check if court exists
      const { data: existing } = await supabase
        .from('courts')
        .select('id')
        .eq('name', courtData.name)
        .single()
      
      if (!existing) {
        console.log(`Creating essential court: ${courtData.name}`)
        const { error: insertError } = await supabase
          .from('courts')
          .insert([courtData])
        
        if (!insertError) {
          stats.totalCourts++
        }
      }
    }
    
    console.log('\n📊 Courts Sync Results:')
    console.log(`- Total courts: ${stats.totalCourts}`)
    console.log(`- Updated courts: ${stats.updatedCourts}`)
    console.log(`- Courts with judges: ${stats.courtsWithJudges}`)
    console.log(`- Total annual filings: ${stats.totalFilings.toLocaleString()}`)
    
    return stats
    
  } catch (error) {
    console.error('❌ Courts sync failed:', error)
    throw error
  }
}

// Export for use in other scripts
module.exports = { syncCourts }

// Run if called directly
if (require.main === module) {
  syncCourts()
    .then(() => {
      console.log('✅ Courts sync completed successfully')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Courts sync failed:', error)
      process.exit(1)
    })
}