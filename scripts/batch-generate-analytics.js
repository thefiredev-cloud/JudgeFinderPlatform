require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')
const pLimit = require('p-limit')

function parseArgs() {
  const args = process.argv.slice(2)
  const config = {
    baseUrl: process.env.TEST_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3005',
    limit: process.env.ANALYTICS_LIMIT ? Number(process.env.ANALYTICS_LIMIT) : undefined,
    concurrency: process.env.ANALYTICS_CONCURRENCY ? Number(process.env.ANALYTICS_CONCURRENCY) : 2,
    delayMs: process.env.ANALYTICS_BATCH_DELAY_MS ? Number(process.env.ANALYTICS_BATCH_DELAY_MS) : 2000,
    judgeIds: [],
    retries: process.env.ANALYTICS_RETRIES ? Number(process.env.ANALYTICS_RETRIES) : 2
  }
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i]
    if (a === '--base' && args[i + 1]) {
      config.baseUrl = args[i + 1]
      i += 1
    } else if (a === '--limit' && args[i + 1]) {
      const v = Number(args[i + 1])
      if (!Number.isNaN(v) && v > 0) config.limit = v
      i += 1
    } else if (a === '--concurrency' && args[i + 1]) {
      const v = Number(args[i + 1])
      if (!Number.isNaN(v) && v > 0) config.concurrency = v
      i += 1
    } else if (a === '--delay' && args[i + 1]) {
      const v = Number(args[i + 1])
      if (!Number.isNaN(v) && v >= 0) config.delayMs = v
      i += 1
    } else if (a === '--ids' && args[i + 1]) {
      config.judgeIds = args[i + 1].split(',').map(id => id.trim()).filter(Boolean)
      i += 1
    } else if (a === '--retries' && args[i + 1]) {
      const v = Number(args[i + 1])
      if (!Number.isNaN(v) && v >= 0) config.retries = v
      i += 1
    }
  }
  return config
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function batchGenerateAnalytics() {
  try {
    console.log('🧮 Starting batch analytics generation for all California judges...')
    const config = parseArgs()

    console.log('⚙️  Config:', {
      baseUrl: config.baseUrl,
      limit: config.limit,
      concurrency: config.concurrency,
      delayMs: config.delayMs,
      judgeIds: config.judgeIds.length,
      retries: config.retries
    })
    
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
    if (typeof config.limit === 'number') {
      console.log(`✂️  Limiting to first ${config.limit} judges for this run`)
    }
    let targetJudges = judgesWithCases

    if (config.judgeIds.length > 0) {
      targetJudges = targetJudges.filter(judge => config.judgeIds.includes(judge.id))
      console.log(`🎯 Filtered to ${targetJudges.length} judges listed via --ids`)
    }

    if (typeof config.limit === 'number') {
      targetJudges = targetJudges.slice(0, config.limit)
      console.log(`✂️  Limiting to first ${config.limit} judges for this run`)
    }

    console.log(`\n🚀 Starting analytics generation for ${targetJudges.length} judges with case data...`)
    
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    
    // Process in smaller batches to avoid overwhelming the system
    const batchSize = Math.max(1, Math.floor(config.concurrency))
    const limiter = pLimit(Math.max(1, config.concurrency))
    for (let i = 0; i < targetJudges.length; i += batchSize) {
      const judgeBatch = targetJudges.slice(i, i + batchSize)
      const batchNumber = Math.ceil((i + 1) / batchSize)
      const totalBatches = Math.ceil(targetJudges.length / batchSize)
      
      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${judgeBatch.length} judges)`)
      
      // Process batch concurrently but with timeout
      const batchPromises = judgeBatch.map((judge, index) => limiter(async () => {
        try {
          const startTime = Date.now()
          console.log(`   ${i + index + 1}/${targetJudges.length} - Generating analytics for ${judge.name}...`)
          
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
          const baseUrl = config.baseUrl
          
          const analyticsData = await fetchWithRetry(`${baseUrl}/api/judges/${judge.id}/analytics`, config.retries)
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
      }))
      
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
      if (i + batchSize < targetJudges.length && config.delayMs > 0) {
        console.log(`   ⏳ Waiting ${config.delayMs}ms before next batch...`)
        await new Promise(resolve => setTimeout(resolve, config.delayMs))
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

async function fetchWithRetry(url, retries = 2, attempt = 0) {
  const maxAttempts = retries + 1
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (attempt + 1 >= maxAttempts) {
      throw error
    }

    const backoff = Math.min(2000 * (attempt + 1), 10000)
    console.warn(`     Retry ${attempt + 1}/${retries} after ${backoff}ms for ${url}: ${error.message}`)
    await new Promise(resolve => setTimeout(resolve, backoff))
    return fetchWithRetry(url, retries, attempt + 1)
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