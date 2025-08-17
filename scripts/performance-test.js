// Performance testing script for JudgeFinder platform
const { performance } = require('perf_hooks')

const BASE_URL = 'http://localhost:3005'

const endpoints = [
  '/api/judges/list?limit=10',
  '/api/judges/list?q=sarah&limit=10',
  '/api/judges/by-slug?slug=test-judge',
  '/api/courts/by-slug?slug=test-court',
  '/api/analytics/performance'
]

async function testEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint}`
  const start = performance.now()
  
  try {
    const response = await fetch(url)
    const end = performance.now()
    const duration = end - start
    
    return {
      endpoint,
      status: response.status,
      duration: Math.round(duration),
      success: response.ok
    }
  } catch (error) {
    const end = performance.now()
    const duration = end - start
    
    return {
      endpoint,
      status: 'ERROR',
      duration: Math.round(duration),
      success: false,
      error: error.message
    }
  }
}

async function runPerformanceTests() {
  console.log('🚀 Starting JudgeFinder Performance Tests...\n')
  
  const results = []
  
  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint}`)
    
    // Test each endpoint 3 times to get average
    const runs = []
    for (let i = 0; i < 3; i++) {
      const result = await testEndpoint(endpoint)
      runs.push(result)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay between runs
    }
    
    const avgDuration = Math.round(runs.reduce((sum, run) => sum + run.duration, 0) / runs.length)
    const minDuration = Math.min(...runs.map(run => run.duration))
    const maxDuration = Math.max(...runs.map(run => run.duration))
    const successRate = (runs.filter(run => run.success).length / runs.length) * 100
    
    const testResult = {
      endpoint,
      avgDuration,
      minDuration,
      maxDuration,
      successRate,
      rating: avgDuration < 500 ? 'GOOD' : avgDuration < 1000 ? 'NEEDS IMPROVEMENT' : 'POOR'
    }
    
    results.push(testResult)
    
    console.log(`  ✓ Avg: ${avgDuration}ms | Min: ${minDuration}ms | Max: ${maxDuration}ms | Success: ${successRate}%`)
    console.log(`  📊 Rating: ${testResult.rating}\n`)
  }
  
  // Summary report
  console.log('📋 PERFORMANCE SUMMARY')
  console.log('=' .repeat(50))
  
  const overallAvg = Math.round(results.reduce((sum, result) => sum + result.avgDuration, 0) / results.length)
  const goodEndpoints = results.filter(r => r.rating === 'GOOD').length
  const needsImprovementEndpoints = results.filter(r => r.rating === 'NEEDS IMPROVEMENT').length
  const poorEndpoints = results.filter(r => r.rating === 'POOR').length
  
  console.log(`Overall Average Response Time: ${overallAvg}ms`)
  console.log(`Endpoints Performance Breakdown:`)
  console.log(`  🟢 Good (< 500ms): ${goodEndpoints}`)
  console.log(`  🟡 Needs Improvement (500-1000ms): ${needsImprovementEndpoints}`)
  console.log(`  🔴 Poor (> 1000ms): ${poorEndpoints}`)
  
  // Detailed results
  console.log('\n📊 DETAILED RESULTS')
  console.log('=' .repeat(50))
  results.forEach(result => {
    const icon = result.rating === 'GOOD' ? '🟢' : result.rating === 'NEEDS IMPROVEMENT' ? '🟡' : '🔴'
    console.log(`${icon} ${result.endpoint}`)
    console.log(`   Average: ${result.avgDuration}ms | Range: ${result.minDuration}-${result.maxDuration}ms`)
  })
  
  // Performance recommendations
  console.log('\n💡 RECOMMENDATIONS')
  console.log('=' .repeat(50))
  
  if (poorEndpoints > 0) {
    console.log('❗ High Priority: Fix endpoints with > 1000ms response times')
    results.filter(r => r.rating === 'POOR').forEach(r => {
      console.log(`   - ${r.endpoint}: ${r.avgDuration}ms`)
    })
  }
  
  if (needsImprovementEndpoints > 0) {
    console.log('⚠️  Medium Priority: Optimize endpoints with 500-1000ms response times')
    results.filter(r => r.rating === 'NEEDS IMPROVEMENT').forEach(r => {
      console.log(`   - ${r.endpoint}: ${r.avgDuration}ms`)
    })
  }
  
  if (overallAvg < 500) {
    console.log('🎉 Excellent! Overall performance is within target (< 500ms)')
  } else if (overallAvg < 1000) {
    console.log('👍 Good performance, but room for improvement')
  } else {
    console.log('🚨 Performance needs significant improvement')
  }
  
  return results
}

// Run the tests
runPerformanceTests().catch(console.error)