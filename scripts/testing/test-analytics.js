require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testAnalytics() {
  try {
    console.log('🧪 Testing judge analytics with real case data...')
    
    // Test judge: Bobbi Tillmon Mallory
    const judgeId = '6cc64ca2-112a-4381-9860-c919475cf792'
    const judgeName = 'Bobbi Tillmon Mallory'
    
    console.log(`📊 Testing analytics for ${judgeName}...`)
    
    // Check if we have cases for this judge
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('*')
      .eq('judge_id', judgeId)
      .order('decision_date', { ascending: false })
      .limit(100)

    if (casesError) {
      console.error('Error fetching cases:', casesError)
      return
    }

    console.log(`🔍 Found ${cases.length} cases for ${judgeName}`)
    
    if (cases.length === 0) {
      console.log('❌ No cases found - analytics will show 0')
      return
    }
    
    // Analyze case distribution
    const casesByType = {}
    const casesByStatus = {}
    const casesDecided = cases.filter(c => c.status === 'decided')
    
    cases.forEach(case_item => {
      const type = case_item.case_type || 'Unknown'
      const status = case_item.status || 'Unknown'
      
      casesByType[type] = (casesByType[type] || 0) + 1
      casesByStatus[status] = (casesByStatus[status] || 0) + 1
    })
    
    console.log('\n📈 Case Analysis:')
    console.log(`- Total cases: ${cases.length}`)
    console.log(`- Decided cases: ${casesDecided.length}`)
    console.log(`- Case types:`, casesByType)
    console.log(`- Case statuses:`, casesByStatus)
    
    // Sample some case data
    console.log('\n📋 Sample cases:')
    cases.slice(0, 5).forEach((case_item, i) => {
      console.log(`  ${i+1}. ${case_item.case_name}`)
      console.log(`     Type: ${case_item.case_type} | Status: ${case_item.status}`)
      if (case_item.outcome) {
        console.log(`     Outcome: ${case_item.outcome}`)
      }
      console.log(`     Filed: ${case_item.filing_date} | Decided: ${case_item.decision_date || 'Pending'}`)
      console.log('')
    })
    
    console.log('✅ Real case data is available for analytics!')
    console.log(`🎯 Visit: http://localhost:3005/judges/${judgeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')} to see analytics`)
    
  } catch (error) {
    console.error('💥 Error testing analytics:', error.message)
  }
}

testAnalytics()