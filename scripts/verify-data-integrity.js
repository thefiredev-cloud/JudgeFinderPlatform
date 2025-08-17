require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyDataIntegrity() {
  try {
    console.log('🔍 Verifying data integrity for 3-year analytics system...\n')
    
    // 1. Check judges table
    console.log('👨‍⚖️ Checking judges table...')
    const { data: judgeStats, error: judgeError } = await supabase
      .from('judges')
      .select('id, jurisdiction, total_cases', { count: 'exact' })
      .eq('jurisdiction', 'CA')
    
    if (judgeError) {
      console.error('❌ Error checking judges:', judgeError.message)
      return false
    }
    
    const totalJudges = judgeStats.length
    const judgesWithCases = judgeStats.filter(j => j.total_cases && j.total_cases > 0).length
    const avgCasesPerJudge = judgeStats.reduce((sum, j) => sum + (j.total_cases || 0), 0) / totalJudges
    
    console.log(`✅ California judges: ${totalJudges}`)
    console.log(`📊 Judges with cases: ${judgesWithCases}`)
    console.log(`📈 Average cases per judge: ${Math.round(avgCasesPerJudge)}`)
    
    // 2. Check cases table
    console.log('\n📋 Checking cases table...')
    
    // Get basic case statistics
    const { data: allCases, error: caseError } = await supabase
      .from('cases')
      .select('judge_id, filing_date, status')
    
    if (caseError) {
      console.error('❌ Error checking cases:', caseError.message)
      return false
    }
    
    // Filter cases for CA judges
    const judgeIds = judgeStats.map(j => j.id)
    const caCases = allCases ? allCases.filter(c => judgeIds.includes(c.judge_id)) : []
    
    // Calculate statistics
    const totalCases = caCases.length
    const uniqueJudges = new Set(caCases.map(c => c.judge_id)).size
    const decidedCases = caCases.filter(c => c.status === 'decided').length
    const settledCases = caCases.filter(c => c.status === 'settled').length
    const pendingCases = caCases.filter(c => c.status === 'pending').length
    const casesSince2022 = caCases.filter(c => c.filing_date >= '2022-01-01').length
    
    const earliestCase = caCases.length > 0 ? 
      Math.min(...caCases.map(c => new Date(c.filing_date).getTime())) : null
    const latestCase = caCases.length > 0 ? 
      Math.max(...caCases.map(c => new Date(c.filing_date).getTime())) : null
    
    const stats = {
      total_cases: totalCases,
      judges_with_cases: uniqueJudges,
      earliest_case: earliestCase ? new Date(earliestCase).toISOString().split('T')[0] : null,
      latest_case: latestCase ? new Date(latestCase).toISOString().split('T')[0] : null,
      decided_cases: decidedCases,
      settled_cases: settledCases,
      pending_cases: pendingCases,
      cases_since_2022: casesSince2022
    }
    
    if (stats.total_cases >= 0) {
      console.log(`✅ Total cases: ${stats.total_cases}`)
      console.log(`⚖️  Judges with cases: ${stats.judges_with_cases}`)
      console.log(`📅 Date range: ${stats.earliest_case} to ${stats.latest_case}`)
      console.log(`📊 Case statuses: ${stats.decided_cases} decided, ${stats.settled_cases} settled, ${stats.pending_cases} pending`)
      console.log(`🗓️  Cases since 2022: ${stats.cases_since_2022}`)
      
      // Calculate 3-year coverage
      const since2022Percentage = Math.round((stats.cases_since_2022 / stats.total_cases) * 100)
      console.log(`📈 3-year coverage: ${since2022Percentage}%`)
      
      if (stats.total_cases === 0) {
        console.log('⚠️  No case data found! Need to run case seeding script.')
        return false
      }
      
      if (since2022Percentage < 90) {
        console.log('⚠️  Less than 90% of cases are from 2022+. Consider re-running seeding script.')
      }
    }
    
    // 3. Check case type distribution
    console.log('\n📊 Checking case type distribution...')
    
    if (caCases.length > 0) {
      const typeDistribution = caCases.reduce((acc, case_item) => {
        const type = case_item.case_type || 'Unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {})
      
      const sortedTypes = Object.entries(typeDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10) // Top 10 case types
      
      console.log('Case type distribution:')
      sortedTypes.forEach(([type, count]) => {
        const percentage = Math.round((count / totalCases) * 100 * 10) / 10
        console.log(`   ${type}: ${count} cases (${percentage}%)`)
      })
    }
    
    // 4. Check analytics cache
    console.log('\n🧮 Checking analytics cache...')
    const { data: cacheStats, error: cacheError } = await supabase
      .from('judge_analytics_cache')
      .select('judge_id, created_at', { count: 'exact' })
    
    if (!cacheError) {
      const cachedAnalytics = cacheStats?.length || 0
      const cachePercentage = totalJudges > 0 ? Math.round((cachedAnalytics / totalJudges) * 100) : 0
      
      console.log(`📊 Cached analytics: ${cachedAnalytics}/${totalJudges} judges (${cachePercentage}%)`)
      
      if (cachedAnalytics > 0) {
        const recentCacheCount = cacheStats.filter(cache => {
          const cacheAge = Date.now() - new Date(cache.created_at).getTime()
          return cacheAge < (24 * 60 * 60 * 1000) // Less than 24 hours old
        }).length
        
        console.log(`🕒 Recent cache (< 24h): ${recentCacheCount} judges`)
      }
    } else {
      console.log('⚠️  Analytics cache table may not exist or be accessible')
    }
    
    // 5. Sample a few judges for detailed verification
    console.log('\n🔬 Sample verification (checking 3 random judges)...')
    const { data: sampleJudges, error: sampleError } = await supabase
      .from('judges')
      .select('id, name, total_cases')
      .eq('jurisdiction', 'CA')
      .gt('total_cases', 0)
      .limit(3)
    
    if (!sampleError && sampleJudges && sampleJudges.length > 0) {
      for (const judge of sampleJudges) {
        const { data: judgeCases, error: judgeCaseError } = await supabase
          .from('cases')
          .select('filing_date, case_type, status', { count: 'exact' })
          .eq('judge_id', judge.id)
          .gte('filing_date', '2022-01-01')
          .limit(10)
        
        if (!judgeCaseError && judgeCases) {
          const actualCaseCount = judgeCases.length
          const years = [...new Set(judgeCases.map(c => new Date(c.filing_date).getFullYear()))].sort()
          const types = [...new Set(judgeCases.map(c => c.case_type))]
          
          console.log(`   ${judge.name}:`)
          console.log(`     📊 ${actualCaseCount} cases (DB shows ${judge.total_cases})`)
          console.log(`     📅 Years: ${years.join(', ')}`)
          console.log(`     📋 Types: ${types.slice(0, 3).join(', ')}${types.length > 3 ? '...' : ''}`)
        }
      }
    }
    
    console.log('\n✅ Data integrity verification completed!')
    
    // Summary and recommendations
    console.log('\n📋 SUMMARY & RECOMMENDATIONS:')
    
    if (judgesWithCases === 0) {
      console.log('❌ CRITICAL: No judges have case data. Run case seeding script immediately.')
      return false
    } else if (judgesWithCases < totalJudges * 0.8) {
      console.log('⚠️  WARNING: Less than 80% of judges have case data. Consider re-running seeding.')
    } else {
      console.log('✅ GOOD: Most judges have case data.')
    }
    
    const totalRecentCases = casesSince2022
    if (totalRecentCases === 0) {
      console.log('❌ CRITICAL: No cases from 2022+. Analytics will not work properly.')
      return false
    } else {
      console.log('✅ GOOD: Recent case data available for 3-year analytics.')
    }
    
    const cachedCount = cacheStats?.length || 0
    if (cachedCount === 0) {
      console.log('💡 RECOMMENDATION: Run batch analytics generation to populate cache.')
    } else if (cachedCount < totalJudges * 0.5) {
      console.log('💡 RECOMMENDATION: Run batch analytics to complete cache coverage.')
    } else {
      console.log('✅ GOOD: Analytics cache has reasonable coverage.')
    }
    
    return true
    
  } catch (error) {
    console.error('💥 Error during verification:', error.message)
    return false
  }
}

// Run verification
if (require.main === module) {
  verifyDataIntegrity()
    .then((success) => {
      if (success) {
        console.log('\n🎉 Data integrity verification passed!')
        console.log('System ready for 3-year analytics generation.')
        process.exit(0)
      } else {
        console.log('\n❌ Data integrity verification failed!')
        console.log('Please fix the issues above before proceeding.')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('💥 Verification failed:', error)
      process.exit(1)
    })
}

module.exports = { verifyDataIntegrity }