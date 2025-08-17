require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testSingleAnalytics() {
  try {
    console.log('🧪 Testing analytics for a single judge...\n')
    
    // Find a judge with case data
    const { data: judges, error: judgeError } = await supabase
      .from('judges')
      .select('id, name, total_cases')
      .eq('jurisdiction', 'CA')
      .gt('total_cases', 0)
      .limit(3)
    
    if (judgeError || !judges || judges.length === 0) {
      console.error('❌ No judges with case data found')
      return false
    }
    
    const testJudge = judges[0]
    console.log(`🎯 Testing analytics for: ${testJudge.name}`)
    console.log(`📊 Expected cases: ${testJudge.total_cases}`)
    
    // Check actual cases in database
    const { data: actualCases, error: casesError } = await supabase
      .from('cases')
      .select('id, filing_date, case_type, status')
      .eq('judge_id', testJudge.id)
      .gte('filing_date', '2022-01-01')
      .limit(10)
    
    if (casesError) {
      console.error('❌ Error fetching cases:', casesError.message)
      return false
    }
    
    console.log(`🔍 Actual cases found: ${actualCases?.length || 0}`)
    
    if (actualCases && actualCases.length > 0) {
      console.log('📋 Sample cases:')
      actualCases.slice(0, 3).forEach(case_item => {
        console.log(`   - ${case_item.filing_date}: ${case_item.case_type || 'Unknown'} (${case_item.status})`)
      })
    }
    
    // Test analytics API
    console.log('\n🧮 Testing analytics API...')
    const response = await fetch(`http://localhost:3005/api/judges/${testJudge.id}/analytics`)
    
    if (!response.ok) {
      console.error(`❌ Analytics API failed: ${response.status}`)
      return false
    }
    
    const analyticsData = await response.json()
    
    console.log('✅ Analytics API response:')
    console.log(`   📊 Cases analyzed: ${analyticsData.analytics.total_cases_analyzed}`)
    console.log(`   📈 Overall confidence: ${analyticsData.analytics.overall_confidence}%`)
    console.log(`   🏷️  Analysis quality: ${analyticsData.analytics.analysis_quality}`)
    console.log(`   🔧 Data source: ${analyticsData.data_source}`)
    console.log(`   🤖 AI model: ${analyticsData.analytics.ai_model}`)
    
    if (analyticsData.analytics.total_cases_analyzed > 0) {
      console.log('\n📊 Sample metrics:')
      console.log(`   Civil plaintiff favor: ${analyticsData.analytics.civil_plaintiff_favor}% (confidence: ${analyticsData.analytics.confidence_civil}%)`)
      console.log(`   Criminal sentencing: ${analyticsData.analytics.criminal_sentencing_severity}% (confidence: ${analyticsData.analytics.confidence_sentencing}%)`)
      
      if (analyticsData.analytics.notable_patterns?.length > 0) {
        console.log('\n🔍 Notable patterns:')
        analyticsData.analytics.notable_patterns.slice(0, 2).forEach(pattern => {
          console.log(`   - ${pattern}`)
        })
      }
    }
    
    // Check if this matches expectations
    const isWorking = analyticsData.analytics.total_cases_analyzed > 0
    
    if (isWorking) {
      console.log('\n✅ SUCCESS: Analytics are working correctly!')
      console.log('   3-year case data is being processed properly')
      return true
    } else {
      console.log('\n⚠️  ISSUE: Analytics found 0 cases to analyze')
      console.log('   This suggests a problem with case data querying')
      return false
    }
    
  } catch (error) {
    console.error('💥 Error during analytics test:', error.message)
    return false
  }
}

// Run the test
if (require.main === module) {
  testSingleAnalytics()
    .then((success) => {
      if (success) {
        console.log('\n🎉 Analytics test passed!')
        process.exit(0)
      } else {
        console.log('\n❌ Analytics test failed!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('💥 Analytics test failed:', error)
      process.exit(1)
    })
}

module.exports = { testSingleAnalytics }