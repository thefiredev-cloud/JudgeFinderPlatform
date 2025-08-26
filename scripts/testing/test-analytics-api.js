require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testAnalyticsAPI() {
  try {
    console.log('🧪 Testing analytics API functionality...')
    
    const judgeId = '6cc64ca2-112a-4381-9860-c919475cf792'
    const judgeName = 'Bobbi Tillmon Mallory'
    
    console.log(`📊 Testing analytics for ${judgeName}...`)
    
    // Simulate the analytics API logic
    const { data: judge, error: judgeError } = await supabase
      .from('judges')
      .select('*')
      .eq('id', judgeId)
      .single()

    if (judgeError || !judge) {
      console.error('❌ Judge not found:', judgeError?.message)
      return
    }

    console.log(`✅ Found judge: ${judge.name}`)

    // Get cases for this judge
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('*')
      .eq('judge_id', judgeId)
      .order('decision_date', { ascending: false })
      .limit(100)

    if (casesError) {
      console.error('❌ Error fetching cases:', casesError.message)
      return
    }

    console.log(`🔍 Found ${cases.length} cases for analytics`)

    if (cases.length === 0) {
      console.log('❌ No cases available - analytics will show profile-based estimates')
      return
    }

    // Analyze case patterns
    const stats = {
      civil: { total: 0, plaintiff_wins: 0 },
      custody: { total: 0, mother_awards: 0 },
      alimony: { total: 0, awarded: 0 },
      contracts: { total: 0, enforced: 0 },
      criminal: { total: 0, strict_sentences: 0 },
      plea: { total: 0, accepted: 0 }
    }
    
    cases.forEach(case_item => {
      const caseType = (case_item.case_type || '').toLowerCase()
      const outcome = (case_item.outcome || '').toLowerCase()
      const summary = (case_item.summary || '').toLowerCase()
      
      // Civil cases analysis
      if (caseType.includes('civil') || caseType.includes('personal injury')) {
        stats.civil.total++
        if (outcome.includes('plaintiff') || outcome.includes('awarded')) {
          stats.civil.plaintiff_wins++
        }
      }
      
      // Family law cases
      if (caseType.includes('family')) {
        if (summary.includes('custody') || outcome.includes('custody')) {
          stats.custody.total++
          if (outcome.includes('mother') || summary.includes('custody to mother')) {
            stats.custody.mother_awards++
          }
        }
        
        if (summary.includes('alimony') || outcome.includes('alimony')) {
          stats.alimony.total++
          if (outcome.includes('alimony awarded') || outcome.includes('spousal support')) {
            stats.alimony.awarded++
          }
        }
      }
      
      // Contract disputes
      if (caseType.includes('contract')) {
        stats.contracts.total++
        if (outcome.includes('enforced') || outcome.includes('breach found')) {
          stats.contracts.enforced++
        }
      }
      
      // Criminal cases
      if (caseType.includes('criminal')) {
        stats.criminal.total++
        if (outcome.includes('prison') || outcome.includes('sentenced to')) {
          stats.criminal.strict_sentences++
        }
        
        if (outcome.includes('plea') || summary.includes('plea')) {
          stats.plea.total++
          if (outcome.includes('plea accepted') || outcome.includes('guilty plea')) {
            stats.plea.accepted++
          }
        }
      }
    })

    console.log('\n📈 Analytics Preview:')
    console.log(`- Total cases: ${cases.length}`)
    console.log(`- Civil cases: ${stats.civil.total} (${stats.civil.total > 0 ? Math.round(stats.civil.plaintiff_wins/stats.civil.total*100) : 0}% plaintiff favor)`)
    console.log(`- Family custody: ${stats.custody.total} cases`)
    console.log(`- Alimony cases: ${stats.alimony.total} cases`)
    console.log(`- Contract disputes: ${stats.contracts.total} cases`)
    console.log(`- Criminal cases: ${stats.criminal.total} cases`)
    console.log(`- Plea cases: ${stats.plea.total} cases`)

    console.log('\n✅ Analytics will show REAL DATA instead of 0 cases!')
    console.log(`🎯 Visit: http://localhost:3005/judges/bobbi-tillmon-mallory`)
    console.log(`📊 Expected to see "${cases.length} cases analyzed" instead of "0 cases analyzed"`)
    
  } catch (error) {
    console.error('💥 Error testing analytics API:', error.message)
  }
}

testAnalyticsAPI()