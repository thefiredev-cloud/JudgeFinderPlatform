#!/usr/bin/env node

/**
 * REGENERATE ALL JUDGE ANALYTICS
 * 
 * This script clears the analytics cache and regenerates fresh analytics
 * for all judges to ensure accuracy and completeness.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

class AnalyticsRegenerator {
  constructor() {
    this.totalJudges = 0
    this.processedCount = 0
    this.successCount = 0
    this.errorCount = 0
    this.skippedCount = 0
    this.batchSize = 5 // Process 5 judges at a time to avoid overwhelming the system
  }

  async run() {
    console.log('🔄 Starting Analytics Regeneration Process')
    console.log('=' .repeat(60))
    
    try {
      // Phase 1: Clear old analytics cache
      await this.clearAnalyticsCache()
      
      // Phase 2: Get all judges
      const judges = await this.getAllJudges()
      
      // Phase 3: Regenerate analytics for all judges
      await this.regenerateAnalytics(judges)
      
      // Phase 4: Verify analytics generation
      await this.verifyAnalytics()
      
      // Phase 5: Generate report
      await this.generateReport()
      
      console.log('\n✅ Analytics regeneration completed successfully!')
      
    } catch (error) {
      console.error('❌ Error during analytics regeneration:', error)
      process.exit(1)
    }
  }

  /**
   * Clear the analytics cache
   */
  async clearAnalyticsCache() {
    console.log('\n📋 Phase 1: Clearing Analytics Cache')
    console.log('-'.repeat(40))
    
    // Get count of existing cache entries
    const { count: cacheCount } = await supabase
      .from('judge_analytics_cache')
      .select('*', { count: 'exact', head: true })
    
    console.log(`Found ${cacheCount || 0} cached analytics entries`)
    
    if (cacheCount && cacheCount > 0) {
      // Clear cache older than 1 day to force regeneration
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      
      const { error } = await supabase
        .from('judge_analytics_cache')
        .delete()
        .lt('created_at', oneDayAgo.toISOString())
      
      if (error) {
        console.error('Error clearing cache:', error)
      } else {
        console.log('✅ Cleared old analytics cache entries')
      }
    }
  }

  /**
   * Get all judges that need analytics
   */
  async getAllJudges() {
    console.log('\n📋 Phase 2: Getting All Judges')
    console.log('-'.repeat(40))
    
    const { data: judges, error } = await supabase
      .from('judges')
      .select('id, name, jurisdiction, total_cases')
      .eq('jurisdiction', 'CA')
      .order('name')
    
    if (error) {
      throw new Error(`Failed to fetch judges: ${error.message}`)
    }
    
    this.totalJudges = judges.length
    console.log(`Found ${this.totalJudges} California judges`)
    
    // Prioritize judges with cases
    const judgesWithCases = judges.filter(j => j.total_cases && j.total_cases > 0)
    const judgesWithoutCases = judges.filter(j => !j.total_cases || j.total_cases === 0)
    
    console.log(`  - ${judgesWithCases.length} judges with case data`)
    console.log(`  - ${judgesWithoutCases.length} judges without case data`)
    
    // Return judges with cases first
    return [...judgesWithCases, ...judgesWithoutCases]
  }

  /**
   * Regenerate analytics for all judges
   */
  async regenerateAnalytics(judges) {
    console.log('\n📋 Phase 3: Regenerating Analytics')
    console.log('-'.repeat(40))
    console.log(`Processing ${judges.length} judges in batches of ${this.batchSize}`)
    
    const startTime = Date.now()
    
    // Process in batches
    for (let i = 0; i < judges.length; i += this.batchSize) {
      const batch = judges.slice(i, i + this.batchSize)
      const batchNumber = Math.floor(i / this.batchSize) + 1
      const totalBatches = Math.ceil(judges.length / this.batchSize)
      
      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches}`)
      
      // Process batch concurrently
      const batchPromises = batch.map(judge => this.generateAnalyticsForJudge(judge))
      const results = await Promise.allSettled(batchPromises)
      
      // Count results
      results.forEach((result, index) => {
        const judge = batch[index]
        if (result.status === 'fulfilled') {
          if (result.value.status === 'success') {
            this.successCount++
            console.log(`  ✅ ${judge.name} - Analytics generated`)
          } else if (result.value.status === 'skipped') {
            this.skippedCount++
            console.log(`  ⏭️  ${judge.name} - ${result.value.reason}`)
          } else {
            this.errorCount++
            console.log(`  ❌ ${judge.name} - ${result.value.error}`)
          }
        } else {
          this.errorCount++
          console.log(`  ❌ ${judge.name} - ${result.reason}`)
        }
        
        this.processedCount++
      })
      
      // Progress update
      const progress = Math.round((this.processedCount / judges.length) * 100)
      const elapsedTime = Math.round((Date.now() - startTime) / 1000)
      const estimatedTotal = Math.round((elapsedTime / this.processedCount) * judges.length)
      const remainingTime = estimatedTotal - elapsedTime
      
      console.log(`\n  Progress: ${this.processedCount}/${judges.length} (${progress}%)`)
      console.log(`  Time: ${elapsedTime}s elapsed, ~${remainingTime}s remaining`)
      console.log(`  Status: ✅ ${this.successCount} | ⏭️  ${this.skippedCount} | ❌ ${this.errorCount}`)
      
      // Small delay between batches
      if (i + this.batchSize < judges.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }

  /**
   * Generate analytics for a single judge
   */
  async generateAnalyticsForJudge(judge) {
    try {
      // Check if recent analytics already exist (generated within last hour)
      const { data: existingCache } = await supabase
        .from('judge_analytics_cache')
        .select('created_at, analytics')
        .eq('judge_id', judge.id)
        .single()
      
      if (existingCache) {
        const cacheAge = Date.now() - new Date(existingCache.created_at).getTime()
        const hoursOld = cacheAge / (1000 * 60 * 60)
        
        // Check if cache is recent and has the new format
        if (hoursOld < 1 && existingCache.analytics && existingCache.analytics.confidence_civil) {
          return {
            status: 'skipped',
            reason: `Recent analytics exists (${Math.round(hoursOld * 60)} min old)`
          }
        }
      }
      
      // Call the API to generate analytics
      const baseUrl = 'http://localhost:3000' // Using port 3000 as discovered
      const response = await fetch(`${baseUrl}/api/judges/${judge.id}/analytics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`)
      }
      
      const data = await response.json()
      
      return {
        status: 'success',
        analytics: data.analytics,
        confidence: data.analytics?.overall_confidence || 0,
        cases_analyzed: data.analytics?.total_cases_analyzed || 0
      }
      
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      }
    }
  }

  /**
   * Verify analytics generation
   */
  async verifyAnalytics() {
    console.log('\n📋 Phase 4: Verifying Analytics')
    console.log('-'.repeat(40))
    
    // Count analytics entries
    const { count: analyticsCount } = await supabase
      .from('judge_analytics_cache')
      .select('*', { count: 'exact', head: true })
    
    // Count judges with analytics
    const { data: judgesWithAnalytics } = await supabase
      .from('judge_analytics_cache')
      .select('judge_id')
    
    const uniqueJudgeIds = new Set(judgesWithAnalytics?.map(a => a.judge_id) || [])
    
    console.log(`✅ Analytics cache entries: ${analyticsCount || 0}`)
    console.log(`✅ Unique judges with analytics: ${uniqueJudgeIds.size}`)
    console.log(`📊 Coverage: ${Math.round((uniqueJudgeIds.size / this.totalJudges) * 100)}%`)
    
    // Check analytics quality
    const { data: sampleAnalytics } = await supabase
      .from('judge_analytics_cache')
      .select('analytics')
      .limit(10)
    
    let highConfidence = 0
    let mediumConfidence = 0
    let lowConfidence = 0
    
    sampleAnalytics?.forEach(entry => {
      const confidence = entry.analytics?.overall_confidence || 0
      if (confidence >= 80) highConfidence++
      else if (confidence >= 60) mediumConfidence++
      else lowConfidence++
    })
    
    console.log('\nAnalytics Quality (sample of 10):')
    console.log(`  🟢 High confidence (≥80%): ${highConfidence}`)
    console.log(`  🟡 Medium confidence (60-79%): ${mediumConfidence}`)
    console.log(`  🔴 Low confidence (<60%): ${lowConfidence}`)
  }

  /**
   * Generate final report
   */
  async generateReport() {
    console.log('\n📋 Phase 5: Generating Report')
    console.log('-'.repeat(40))
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_judges: this.totalJudges,
        processed: this.processedCount,
        successful: this.successCount,
        skipped: this.skippedCount,
        errors: this.errorCount,
        success_rate: `${Math.round((this.successCount / this.processedCount) * 100)}%`
      },
      recommendations: []
    }
    
    // Add recommendations
    if (this.errorCount > 0) {
      report.recommendations.push(
        `Review ${this.errorCount} judges that failed analytics generation`,
        'Check API endpoints and AI service availability'
      )
    }
    
    if (this.successCount < this.totalJudges * 0.9) {
      report.recommendations.push(
        'Consider running analytics generation again for judges without analytics',
        'Ensure sufficient API credits for AI services'
      )
    }
    
    // Save report
    const fs = require('fs').promises
    const reportPath = `./reports/analytics-regeneration-${Date.now()}.json`
    await fs.mkdir('./reports', { recursive: true })
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
    
    console.log('\n📊 REGENERATION SUMMARY')
    console.log('=' .repeat(60))
    console.log(`Total Judges: ${this.totalJudges}`)
    console.log(`Processed: ${this.processedCount}`)
    console.log(`✅ Successful: ${this.successCount}`)
    console.log(`⏭️  Skipped (recent): ${this.skippedCount}`)
    console.log(`❌ Errors: ${this.errorCount}`)
    console.log(`Success Rate: ${Math.round((this.successCount / this.processedCount) * 100)}%`)
    console.log(`\nReport saved to: ${reportPath}`)
    console.log('=' .repeat(60))
  }
}

// Run the regenerator
async function main() {
  const regenerator = new AnalyticsRegenerator()
  await regenerator.run()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { AnalyticsRegenerator }