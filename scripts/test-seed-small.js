require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Import case generation functions from the main seed script
const { generateCase, CASE_TYPES } = require('./seed-judge-cases.js')

async function testSeedSmall() {
  try {
    console.log('🧪 Starting small test seed (5 judges only)...')
    
    // Get first 5 California judges
    const { data: judges, error: judgesError } = await supabase
      .from('judges')
      .select('id, name, court_id')
      .eq('jurisdiction', 'CA')
      .limit(5)
    
    if (judgesError) {
      throw new Error(`Failed to fetch judges: ${judgesError.message}`)
    }
    
    console.log(`📊 Found ${judges.length} judges for testing`)
    
    let totalCasesCreated = 0
    const casesPerJudge = 100
    
    for (const judge of judges) {
      console.log(`⚖️  Generating ${casesPerJudge} cases for ${judge.name}...`)
      
      const cases = []
      for (let j = 1; j <= casesPerJudge; j++) {
        cases.push(generateCase(judge.id, judge.court_id, j))
      }
      
      // Insert cases for this judge
      const { error: insertError } = await supabase
        .from('cases')
        .insert(cases)
      
      if (insertError) {
        console.error(`❌ Failed to insert cases for ${judge.name}:`, insertError.message)
        continue
      }
      
      totalCasesCreated += cases.length
      
      // Update judge's total_cases count
      await supabase
        .from('judges')
        .update({ total_cases: casesPerJudge })
        .eq('id', judge.id)
        
      console.log(`✅ Created ${cases.length} cases for ${judge.name}`)
    }
    
    console.log(`🎉 Test seeding completed!`)
    console.log(`📈 Total cases created: ${totalCasesCreated}`)
    console.log(`⚖️  Judges processed: ${judges.length}`)
    
    // Clear analytics cache for these judges
    console.log('🗑️  Clearing analytics cache...')
    const { error: cacheError } = await supabase
      .from('judge_analytics_cache')
      .delete()
      .in('judge_id', judges.map(j => j.id))
    
    if (cacheError) {
      console.warn('Warning: Could not clear analytics cache:', cacheError.message)
    } else {
      console.log('✅ Analytics cache cleared for test judges')
    }
    
    // Output judge info for testing
    console.log('\n📋 Judges ready for testing:')
    for (const judge of judges) {
      console.log(`- ${judge.name} (ID: ${judge.id})`)
    }
    
  } catch (error) {
    console.error('💥 Error during test seeding:', error.message)
    process.exit(1)
  }
}

// Run the test seeding
testSeedSmall()
  .then(() => {
    console.log('✨ Test seeding process completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Test seeding failed:', error)
    process.exit(1)
  })