#!/usr/bin/env node

/**
 * Production Data Population Script
 * Safely populates production Supabase database with judges and courts data
 * 
 * Usage:
 *   npm run populate:production
 *   
 * Environment:
 *   Requires .env.production file with production Supabase credentials
 */

require('dotenv').config({ path: '.env.production' })
const { createClient } = require('@supabase/supabase-js')
const readline = require('readline')

// Validate environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'COURTLISTENER_API_KEY'
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:')
  missingVars.forEach(varName => console.error(`   - ${varName}`))
  console.error('\nPlease ensure .env.production file contains all required variables')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Progress tracking
let progress = {
  courts: { total: 0, completed: 0, failed: 0 },
  judges: { total: 0, completed: 0, failed: 0 },
  cases: { total: 0, completed: 0, failed: 0 },
  startTime: Date.now()
}

// Utility function to prompt user
function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.toLowerCase().trim())
    })
  })
}

// Display progress
function displayProgress() {
  const elapsed = Math.round((Date.now() - progress.startTime) / 1000)
  console.log('\n📊 Population Progress:')
  console.log(`   Courts: ${progress.courts.completed}/${progress.courts.total} (${progress.courts.failed} failed)`)
  console.log(`   Judges: ${progress.judges.completed}/${progress.judges.total} (${progress.judges.failed} failed)`)
  console.log(`   Cases:  ${progress.cases.completed}/${progress.cases.total} (${progress.cases.failed} failed)`)
  console.log(`   Time elapsed: ${elapsed} seconds`)
}

// Check current database status
async function checkDatabaseStatus() {
  console.log('\n🔍 Checking current database status...')
  
  try {
    // Check courts
    const { count: courtCount, error: courtError } = await supabase
      .from('courts')
      .select('*', { count: 'exact', head: true })

    if (courtError) throw courtError

    // Check judges
    const { count: judgeCount, error: judgeError } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })

    if (judgeError) throw judgeError

    // Check cases
    const { count: caseCount, error: caseError } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })

    if (caseError) throw caseError

    console.log('\n📈 Current Database Status:')
    console.log(`   Courts: ${courtCount || 0} records`)
    console.log(`   Judges: ${judgeCount || 0} records`)
    console.log(`   Cases:  ${caseCount || 0} records`)

    return {
      courts: courtCount || 0,
      judges: judgeCount || 0,
      cases: caseCount || 0
    }
  } catch (error) {
    console.error('❌ Failed to check database status:', error.message)
    return { courts: 0, judges: 0, cases: 0 }
  }
}

// Sync courts from CourtListener
async function syncCourts() {
  console.log('\n🏛️ Starting court synchronization...')
  progress.courts.total = 909 // Expected CA courts

  try {
    const syncScript = require('./sync/sync-courts-manual.js')
    const result = await syncScript.syncCourts()
    
    if (result.success) {
      progress.courts.completed = result.courtsAdded || 0
      console.log(`✅ Successfully synced ${progress.courts.completed} courts`)
    } else {
      throw new Error(result.error || 'Court sync failed')
    }
  } catch (error) {
    console.error('❌ Court sync error:', error.message)
    progress.courts.failed = progress.courts.total
    throw error
  }
}

// Sync judges from CourtListener
async function syncJudges() {
  console.log('\n⚖️ Starting judge synchronization...')
  progress.judges.total = 1810 // Expected CA judges

  try {
    const syncScript = require('./sync/sync-judges-manual.js')
    const result = await syncScript.syncJudges()
    
    if (result.success || result.existingJudges) {
      progress.judges.completed = result.judgesAdded || result.existingJudges || 0
      console.log(`✅ Successfully synced ${progress.judges.completed} judges`)
    } else {
      throw new Error(result.error || 'Judge sync failed')
    }
  } catch (error) {
    console.error('❌ Judge sync error:', error.message)
    progress.judges.failed = progress.judges.total
    throw error
  }
}

// Generate sample cases for judges
async function generateCases(limit = 50) {
  console.log(`\n📚 Generating sample cases for first ${limit} judges...`)
  
  try {
    // Get a sample of judges
    const { data: judges, error: judgeError } = await supabase
      .from('judges')
      .select('id, name, court_id')
      .eq('jurisdiction', 'CA')
      .limit(limit)

    if (judgeError) throw judgeError

    if (!judges || judges.length === 0) {
      console.log('⚠️ No judges found to generate cases for')
      return
    }

    const seedScript = require('./seed-judge-cases.js')
    const { generateCase, CASE_TYPES } = seedScript

    progress.cases.total = judges.length * 100 // 100 cases per judge for sample

    let totalCasesCreated = 0
    const batchSize = 100

    for (const judge of judges) {
      const cases = []
      
      // Generate 100 sample cases per judge across recent years
      for (let i = 0; i < 100; i++) {
        const year = 2022 + Math.floor(Math.random() * 3) // 2022-2024
        cases.push(generateCase(judge.id, judge.court_id, i + 1, year))
      }

      // Insert in batches
      for (let i = 0; i < cases.length; i += batchSize) {
        const batch = cases.slice(i, i + batchSize)
        const { error: insertError } = await supabase
          .from('cases')
          .insert(batch)

        if (insertError) {
          console.error(`⚠️ Failed to insert cases for ${judge.name}:`, insertError.message)
          progress.cases.failed += batch.length
        } else {
          progress.cases.completed += batch.length
          totalCasesCreated += batch.length
        }
      }

      // Update judge's total_cases count
      await supabase
        .from('judges')
        .update({ total_cases: cases.length })
        .eq('id', judge.id)
    }

    console.log(`✅ Generated ${totalCasesCreated} sample cases`)
  } catch (error) {
    console.error('❌ Case generation error:', error.message)
    throw error
  }
}

// Main population function
async function populateProduction() {
  console.log('🚀 JudgeFinder Production Data Population Script')
  console.log('================================================')
  console.log(`📍 Target Database: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log(`🔑 Using service role key: ${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10)}...`)
  
  // Check current status
  const currentStatus = await checkDatabaseStatus()
  
  // If data already exists, ask for confirmation
  if (currentStatus.judges > 0 || currentStatus.courts > 0) {
    console.log('\n⚠️  WARNING: Production database already contains data!')
    const answer = await promptUser('Do you want to continue and add more data? (yes/no): ')
    
    if (answer !== 'yes' && answer !== 'y') {
      console.log('❌ Population cancelled by user')
      process.exit(0)
    }
  }

  // Confirm production deployment
  console.log('\n⚠️  PRODUCTION WARNING: This will populate your PRODUCTION database!')
  const confirm = await promptUser('Are you sure you want to continue? Type "populate production" to confirm: ')
  
  if (confirm !== 'populate production') {
    console.log('❌ Population cancelled - confirmation not received')
    process.exit(0)
  }

  console.log('\n🎯 Starting production data population...')
  
  try {
    // Step 1: Sync Courts
    await syncCourts()
    displayProgress()
    
    // Step 2: Sync Judges
    await syncJudges()
    displayProgress()
    
    // Step 3: Generate sample cases (optional)
    const generateSampleCases = await promptUser('\nGenerate sample cases for demonstration? (yes/no): ')
    if (generateSampleCases === 'yes' || generateSampleCases === 'y') {
      await generateCases(50) // Generate for first 50 judges only
      displayProgress()
    }
    
    // Final status check
    console.log('\n✅ Population completed! Verifying final status...')
    const finalStatus = await checkDatabaseStatus()
    
    console.log('\n🎉 Production Database Successfully Populated!')
    console.log('==============================================')
    console.log(`✅ Courts: ${finalStatus.courts} records`)
    console.log(`✅ Judges: ${finalStatus.judges} records`)
    console.log(`✅ Cases:  ${finalStatus.cases} records`)
    
    const totalTime = Math.round((Date.now() - progress.startTime) / 1000)
    console.log(`\n⏱️ Total time: ${totalTime} seconds`)
    
    console.log('\n📌 Next Steps:')
    console.log('1. Visit https://judgefinder.io to verify data is visible')
    console.log('2. Check the /judges and /courts pages')
    console.log('3. Test the search functionality')
    console.log('4. Set up automated sync schedule (run: npm run setup:cron)')
    
  } catch (error) {
    console.error('\n💥 Population failed:', error.message)
    displayProgress()
    console.error('\n🔧 Troubleshooting:')
    console.error('1. Verify your .env.production file has correct credentials')
    console.error('2. Check Supabase dashboard for any errors')
    console.error('3. Ensure CourtListener API key is valid')
    console.error('4. Try running individual sync scripts manually')
    process.exit(1)
  }
}

// Run the population script
if (require.main === module) {
  populateProduction()
    .then(() => {
      console.log('\n✨ Production population completed successfully!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error)
      process.exit(1)
    })
}

module.exports = { populateProduction, checkDatabaseStatus }