require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function batchGenerateAnalytics() {
  try {
    console.log('🧮 Starting batch analytics generation for all California judges...')
    
    // Get all California judges with case counts
    const { data: judges, error: judgesError } = await supabase
      .from('judges')
      .select('id, name, total_cases')
      .eq('jurisdiction', 'CA')
      .order('name')
    
    if (judgesError) {
      throw new Error(`Failed to fetch judges: ${judgesError.message}`)
    }
    
    console.log(`📊 Found ${judges.length} California judges for analytics generation`)
    
    // Filter judges with cases (should have cases if seeding was successful)
    const judgesWithCases = judges.filter(judge => judge.total_cases && judge.total_cases > 0)
    const judgesWithoutCases = judges.filter(judge => !judge.total_cases || judge.total_cases === 0)
    
    console.log(`✅ ${judgesWithCases.length} judges have case data`)
    console.log(`⚠️  ${judgesWithoutCases.length} judges have no case data`)
    
    if (judgesWithoutCases.length > 0) {
      console.log('\nJudges without cases:')
      judgesWithoutCases.slice(0, 5).forEach(judge => {
        console.log(`   - ${judge.name} (${judge.total_cases || 0} cases)`)
      })
      if (judgesWithoutCases.length > 5) {
        console.log(`   ... and ${judgesWithoutCases.length - 5} more`)
      }
    }
    
    // Start analytics generation
    console.log(`\n🚀 Starting analytics generation for ${judgesWithCases.length} judges with case data...`)
    
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    
    // Process in smaller batches to avoid overwhelming the system
    const batchSize = 10
    for (let i = 0; i < judgesWithCases.length; i += batchSize) {
      const judgeBatch = judgesWithCases.slice(i, i + batchSize)
      const batchNumber = Math.ceil((i + 1) / batchSize)
      const totalBatches = Math.ceil(judgesWithCases.length / batchSize)
      
      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${judgeBatch.length} judges)`)
      
      // Process batch concurrently but with timeout
      const batchPromises = judgeBatch.map(async (judge, index) => {
        try {
          const startTime = Date.now()
          console.log(`   ${i + index + 1}/${judgesWithCases.length} - Generating analytics for ${judge.name}...`)
          
          // Check if analytics already exist and are recent
          const { data: existingCache } = await supabase
            .from('judge_analytics_cache')
            .select('created_at')
            .eq('judge_id', judge.id)
            .single()
          
          if (existingCache) {
            const cacheAge = Date.now() - new Date(existingCache.created_at).getTime()
            const hoursSinceCache = cacheAge / (1000 * 60 * 60)
            
            if (hoursSinceCache < 24) { // Skip if cached within last 24 hours
              console.log(`   ⏭️  Skipping ${judge.name} - analytics cached ${Math.round(hoursSinceCache)}h ago`)
              return { status: 'skipped', judge: judge.name, reason: 'recent_cache' }
            }
          }
          
          // Generate analytics by calling the API endpoint
          const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://judgefinder.io'
            : 'http://localhost:3005'
          
          const response = await fetch(`${baseUrl}/api/judges/${judge.id}/analytics`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
          })
          
          if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`)
          }
          
          const analyticsData = await response.json()
          const duration = Date.now() - startTime
          
          console.log(`   ✅ Generated analytics for ${judge.name} (${duration}ms, ${analyticsData.analytics.total_cases_analyzed} cases, ${analyticsData.analytics.overall_confidence}% confidence)`)
          
          return { 
            status: 'success', 
            judge: judge.name, 
            cases: analyticsData.analytics.total_cases_analyzed,
            confidence: analyticsData.analytics.overall_confidence,
            quality: analyticsData.analytics.analysis_quality,
            duration 
          }
          
        } catch (error) {
          console.log(`   ❌ Failed to generate analytics for ${judge.name}: ${error.message}`)
          return { status: 'error', judge: judge.name, error: error.message }
        }
      })
      
      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises)
      
      // Count results
      batchResults.forEach(result => {
        switch (result.status) {
          case 'success': successCount++; break
          case 'error': errorCount++; break
          case 'skipped': skippedCount++; break
        }
      })
      
      console.log(`   📊 Batch ${batchNumber} completed: ${batchResults.filter(r => r.status === 'success').length} success, ${batchResults.filter(r => r.status === 'error').length} errors, ${batchResults.filter(r => r.status === 'skipped').length} skipped`)
      
      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < judgesWithCases.length) {
        console.log('   ⏳ Waiting 3 seconds before next batch...')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }
    
    console.log('\n🎉 Batch analytics generation completed!')
    console.log(`📈 Results summary:`)
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   ⏭️  Skipped (cached): ${skippedCount}`)
    console.log(`   📊 Total processed: ${successCount + errorCount + skippedCount}`)
    
    // Generate summary statistics
    if (successCount > 0) {
      const { data: analyticsStats } = await supabase
        .from('judge_analytics_cache')
        .select('analytics')
        .limit(100)
      
      if (analyticsStats && analyticsStats.length > 0) {
        const avgConfidence = analyticsStats.reduce((sum, item) => 
          sum + (item.analytics?.overall_confidence || 0), 0) / analyticsStats.length
        
        const avgCases = analyticsStats.reduce((sum, item) => 
          sum + (item.analytics?.total_cases_analyzed || 0), 0) / analyticsStats.length
        
        console.log(`\n📊 Analytics quality overview (sample of ${analyticsStats.length} judges):`)
        console.log(`   📈 Average confidence: ${Math.round(avgConfidence)}%`)
        console.log(`   📋 Average cases analyzed: ${Math.round(avgCases)}`)
        
        const qualityDistribution = analyticsStats.reduce((acc, item) => {
          const quality = item.analytics?.analysis_quality || 'unknown'
          acc[quality] = (acc[quality] || 0) + 1
          return acc
        }, {})
        
        console.log(`   🏷️  Quality distribution:`)
        Object.entries(qualityDistribution).forEach(([quality, count]) => {
          console.log(`      ${quality}: ${count} judges`)
        })
      }
    }
    
    if (errorCount > 0) {
      console.log(`\n⚠️  ${errorCount} judges had errors during analytics generation`)
      console.log('Consider running the script again to retry failed judges')
    }
    
  } catch (error) {
    console.error('💥 Error during batch analytics generation:', error.message)
    process.exit(1)
  }
}

// Run the batch generation
if (require.main === module) {
  batchGenerateAnalytics()
    .then(() => {
      console.log('✨ Batch analytics generation process completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Batch analytics generation failed:', error)
      process.exit(1)
    })
}

module.exports = { batchGenerateAnalytics }