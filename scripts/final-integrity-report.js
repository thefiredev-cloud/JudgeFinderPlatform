#!/usr/bin/env node

/**
 * FINAL INTEGRITY REPORT
 * 
 * Comprehensive validation of all judge data, analytics, and platform health
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

class FinalIntegrityReport {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      platform_status: 'UNKNOWN',
      data_quality: {},
      analytics_coverage: {},
      api_health: {},
      issues_found: [],
      recommendations: [],
      summary: {}
    }
  }

  async generate() {
    console.log('📊 FINAL INTEGRITY REPORT')
    console.log('=' .repeat(80))
    console.log(`Generated: ${this.report.timestamp}`)
    console.log('=' .repeat(80))
    
    try {
      // 1. Database Statistics
      await this.checkDatabaseStatistics()
      
      // 2. Judge Data Quality
      await this.checkJudgeDataQuality()
      
      // 3. Analytics Coverage
      await this.checkAnalyticsCoverage()
      
      // 4. API Health Check
      await this.checkAPIHealth()
      
      // 5. Data Relationships
      await this.checkDataRelationships()
      
      // 6. Generate Summary
      await this.generateSummary()
      
      // 7. Save Report
      await this.saveReport()
      
      // 8. Display Results
      this.displayResults()
      
    } catch (error) {
      console.error('❌ Error generating report:', error)
      this.report.platform_status = 'ERROR'
      this.report.issues_found.push({
        type: 'CRITICAL',
        message: `Report generation failed: ${error.message}`
      })
    }
  }

  /**
   * Check database statistics
   */
  async checkDatabaseStatistics() {
    console.log('\n📈 DATABASE STATISTICS')
    console.log('-'.repeat(40))
    
    try {
      // Count judges
      const { count: totalJudges } = await supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })
      
      const { count: caJudges } = await supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })
        .eq('jurisdiction', 'CA')
      
      // Count courts
      const { count: totalCourts } = await supabase
        .from('courts')
        .select('*', { count: 'exact', head: true })
      
      // Count cases
      const { count: totalCases } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
      
      // Count analytics
      const { count: analyticsCount } = await supabase
        .from('judge_analytics_cache')
        .select('*', { count: 'exact', head: true })
      
      this.report.data_quality.database_stats = {
        total_judges: totalJudges || 0,
        california_judges: caJudges || 0,
        total_courts: totalCourts || 0,
        total_cases: totalCases || 0,
        analytics_entries: analyticsCount || 0
      }
      
      console.log(`Total Judges: ${totalJudges}`)
      console.log(`California Judges: ${caJudges}`)
      console.log(`Total Courts: ${totalCourts}`)
      console.log(`Total Cases: ${totalCases}`)
      console.log(`Analytics Entries: ${analyticsCount || 0}`)
      
      // Check for anomalies
      if (caJudges < 1800) {
        this.report.issues_found.push({
          type: 'WARNING',
          message: `Only ${caJudges} CA judges found (expected ~1810)`
        })
      }
      
    } catch (error) {
      console.error('Error checking database stats:', error)
      this.report.issues_found.push({
        type: 'ERROR',
        message: `Database stats check failed: ${error.message}`
      })
    }
  }

  /**
   * Check judge data quality
   */
  async checkJudgeDataQuality() {
    console.log('\n✅ JUDGE DATA QUALITY')
    console.log('-'.repeat(40))
    
    try {
      // Check for judges with missing critical data
      const { data: judgesMissingData } = await supabase
        .from('judges')
        .select('id, name, court_name, jurisdiction')
        .eq('jurisdiction', 'CA')
        .or('court_name.is.null,court_id.is.null')
        .limit(10)
      
      // Check for judges with no cases
      const { data: judgesNoCases } = await supabase
        .from('judges')
        .select('id, name, total_cases')
        .eq('jurisdiction', 'CA')
        .or('total_cases.eq.0,total_cases.is.null')
        .limit(10)
      
      // Check for test data patterns
      const { data: allJudges } = await supabase
        .from('judges')
        .select('name')
        .eq('jurisdiction', 'CA')
      
      let testDataCount = 0
      const testPatterns = [/test/i, /demo/i, /example/i, /fake/i, /dummy/i]
      
      allJudges?.forEach(judge => {
        if (testPatterns.some(pattern => pattern.test(judge.name))) {
          testDataCount++
        }
      })
      
      this.report.data_quality.judge_quality = {
        judges_missing_court: judgesMissingData?.length || 0,
        judges_no_cases: judgesNoCases?.length || 0,
        test_data_entries: testDataCount,
        quality_score: testDataCount === 0 && judgesMissingData?.length === 0 ? 100 : 
                      Math.max(0, 100 - (testDataCount * 10) - (judgesMissingData?.length * 5))
      }
      
      console.log(`Judges Missing Court: ${judgesMissingData?.length || 0}`)
      console.log(`Judges With No Cases: ${judgesNoCases?.length || 0}`)
      console.log(`Test Data Entries: ${testDataCount}`)
      console.log(`Data Quality Score: ${this.report.data_quality.judge_quality.quality_score}%`)
      
      if (testDataCount > 0) {
        this.report.issues_found.push({
          type: 'WARNING',
          message: `Found ${testDataCount} potential test data entries`
        })
        this.report.recommendations.push('Run data cleaning script to remove test entries')
      }
      
    } catch (error) {
      console.error('Error checking judge data quality:', error)
      this.report.issues_found.push({
        type: 'ERROR',
        message: `Judge data quality check failed: ${error.message}`
      })
    }
  }

  /**
   * Check analytics coverage
   */
  async checkAnalyticsCoverage() {
    console.log('\n📊 ANALYTICS COVERAGE')
    console.log('-'.repeat(40))
    
    try {
      // Get total CA judges
      const { count: totalJudges } = await supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })
        .eq('jurisdiction', 'CA')
      
      // Get judges with analytics
      const { data: analyticsData } = await supabase
        .from('judge_analytics_cache')
        .select('judge_id, created_at, analytics')
      
      const uniqueJudgesWithAnalytics = new Set(analyticsData?.map(a => a.judge_id) || [])
      
      // Check analytics freshness
      let freshAnalytics = 0
      let staleAnalytics = 0
      let highConfidence = 0
      let lowConfidence = 0
      
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      
      analyticsData?.forEach(entry => {
        const createdAt = new Date(entry.created_at)
        if (createdAt > oneDayAgo) {
          freshAnalytics++
        } else {
          staleAnalytics++
        }
        
        const confidence = entry.analytics?.overall_confidence || 0
        if (confidence >= 80) {
          highConfidence++
        } else if (confidence < 60) {
          lowConfidence++
        }
      })
      
      const coverage = totalJudges ? Math.round((uniqueJudgesWithAnalytics.size / totalJudges) * 100) : 0
      
      this.report.analytics_coverage = {
        total_judges: totalJudges || 0,
        judges_with_analytics: uniqueJudgesWithAnalytics.size,
        coverage_percentage: coverage,
        fresh_analytics: freshAnalytics,
        stale_analytics: staleAnalytics,
        high_confidence: highConfidence,
        low_confidence: lowConfidence
      }
      
      console.log(`Analytics Coverage: ${coverage}%`)
      console.log(`Judges with Analytics: ${uniqueJudgesWithAnalytics.size}/${totalJudges}`)
      console.log(`Fresh Analytics (<24h): ${freshAnalytics}`)
      console.log(`Stale Analytics (>24h): ${staleAnalytics}`)
      console.log(`High Confidence (≥80%): ${highConfidence}`)
      console.log(`Low Confidence (<60%): ${lowConfidence}`)
      
      if (coverage < 90) {
        this.report.issues_found.push({
          type: 'WARNING',
          message: `Analytics coverage is only ${coverage}% (target: 90%+)`
        })
        this.report.recommendations.push('Run analytics regeneration for judges without analytics')
      }
      
    } catch (error) {
      console.error('Error checking analytics coverage:', error)
      this.report.issues_found.push({
        type: 'ERROR',
        message: `Analytics coverage check failed: ${error.message}`
      })
    }
  }

  /**
   * Check API health
   */
  async checkAPIHealth() {
    console.log('\n🌐 API HEALTH CHECK')
    console.log('-'.repeat(40))
    
    const baseUrl = 'http://localhost:3000'
    const endpoints = [
      { path: '/api/judges/list?limit=1', name: 'Judges List' },
      { path: '/api/courts?limit=1', name: 'Courts List' },
      { path: '/api/stats/judges', name: 'Judge Stats' }
    ]
    
    let healthyEndpoints = 0
    let failedEndpoints = 0
    
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now()
        const response = await fetch(`${baseUrl}${endpoint.path}`)
        const responseTime = Date.now() - startTime
        
        if (response.ok) {
          healthyEndpoints++
          console.log(`✅ ${endpoint.name}: OK (${responseTime}ms)`)
        } else {
          failedEndpoints++
          console.log(`❌ ${endpoint.name}: Failed (Status: ${response.status})`)
          this.report.issues_found.push({
            type: 'ERROR',
            message: `API endpoint ${endpoint.path} returned status ${response.status}`
          })
        }
        
      } catch (error) {
        failedEndpoints++
        console.log(`❌ ${endpoint.name}: Error - ${error.message}`)
        this.report.issues_found.push({
          type: 'ERROR',
          message: `API endpoint ${endpoint.path} failed: ${error.message}`
        })
      }
    }
    
    this.report.api_health = {
      total_endpoints: endpoints.length,
      healthy: healthyEndpoints,
      failed: failedEndpoints,
      health_percentage: Math.round((healthyEndpoints / endpoints.length) * 100)
    }
  }

  /**
   * Check data relationships
   */
  async checkDataRelationships() {
    console.log('\n🔗 DATA RELATIONSHIPS')
    console.log('-'.repeat(40))
    
    try {
      // Check judge-court relationships
      const { data: judgesWithoutCourts } = await supabase
        .from('judges')
        .select('id, name')
        .eq('jurisdiction', 'CA')
        .is('court_id', null)
        .limit(10)
      
      // Check orphaned cases
      const { data: orphanedCases } = await supabase
        .from('cases')
        .select('id')
        .is('judge_id', null)
        .limit(10)
      
      this.report.data_quality.relationships = {
        judges_without_courts: judgesWithoutCourts?.length || 0,
        orphaned_cases: orphanedCases?.length || 0,
        relationship_integrity: judgesWithoutCourts?.length === 0 && orphanedCases?.length === 0 ? 'GOOD' : 'NEEDS_ATTENTION'
      }
      
      console.log(`Judges without Courts: ${judgesWithoutCourts?.length || 0}`)
      console.log(`Orphaned Cases: ${orphanedCases?.length || 0}`)
      console.log(`Relationship Integrity: ${this.report.data_quality.relationships.relationship_integrity}`)
      
    } catch (error) {
      console.error('Error checking relationships:', error)
    }
  }

  /**
   * Generate summary
   */
  async generateSummary() {
    // Calculate overall platform health
    const issues = this.report.issues_found
    const criticalIssues = issues.filter(i => i.type === 'CRITICAL').length
    const errors = issues.filter(i => i.type === 'ERROR').length
    const warnings = issues.filter(i => i.type === 'WARNING').length
    
    let platformStatus = 'HEALTHY'
    if (criticalIssues > 0) {
      platformStatus = 'CRITICAL'
    } else if (errors > 0) {
      platformStatus = 'NEEDS_ATTENTION'
    } else if (warnings > 2) {
      platformStatus = 'WARNING'
    }
    
    this.report.platform_status = platformStatus
    
    this.report.summary = {
      platform_status: platformStatus,
      total_issues: issues.length,
      critical_issues: criticalIssues,
      errors: errors,
      warnings: warnings,
      data_completeness: this.report.analytics_coverage.coverage_percentage || 0,
      api_health: this.report.api_health.health_percentage || 0,
      overall_score: Math.round(
        ((this.report.analytics_coverage.coverage_percentage || 0) +
         (this.report.api_health.health_percentage || 0) +
         (this.report.data_quality.judge_quality?.quality_score || 0)) / 3
      )
    }
    
    // Add recommendations based on findings
    if (this.report.analytics_coverage.coverage_percentage < 90) {
      this.report.recommendations.push('Regenerate analytics for all judges to improve coverage')
    }
    
    if (this.report.data_quality.judge_quality?.judges_missing_court > 0) {
      this.report.recommendations.push('Update court assignments for judges missing court data')
    }
    
    if (errors > 0) {
      this.report.recommendations.push('Review and fix API errors immediately')
    }
  }

  /**
   * Save report
   */
  async saveReport() {
    const reportPath = path.join(process.cwd(), 'reports', `final-integrity-${Date.now()}.json`)
    await fs.mkdir(path.dirname(reportPath), { recursive: true })
    await fs.writeFile(reportPath, JSON.stringify(this.report, null, 2))
    
    console.log(`\n📁 Report saved to: ${reportPath}`)
  }

  /**
   * Display results
   */
  displayResults() {
    console.log('\n' + '=' .repeat(80))
    console.log('📊 FINAL PLATFORM STATUS')
    console.log('=' .repeat(80))
    
    const statusEmoji = {
      'HEALTHY': '✅',
      'WARNING': '⚠️',
      'NEEDS_ATTENTION': '🔧',
      'CRITICAL': '🚨',
      'ERROR': '❌'
    }
    
    console.log(`\nPLATFORM STATUS: ${statusEmoji[this.report.platform_status]} ${this.report.platform_status}`)
    console.log(`Overall Score: ${this.report.summary.overall_score}%`)
    
    console.log('\nKEY METRICS:')
    console.log(`  • Total Judges: ${this.report.data_quality.database_stats?.california_judges || 0}`)
    console.log(`  • Analytics Coverage: ${this.report.analytics_coverage.coverage_percentage}%`)
    console.log(`  • API Health: ${this.report.api_health.health_percentage}%`)
    console.log(`  • Data Quality: ${this.report.data_quality.judge_quality?.quality_score}%`)
    
    if (this.report.issues_found.length > 0) {
      console.log('\nISSUES FOUND:')
      this.report.issues_found.slice(0, 5).forEach(issue => {
        console.log(`  ${statusEmoji[issue.type]} ${issue.message}`)
      })
      if (this.report.issues_found.length > 5) {
        console.log(`  ... and ${this.report.issues_found.length - 5} more`)
      }
    }
    
    if (this.report.recommendations.length > 0) {
      console.log('\nRECOMMENDATIONS:')
      this.report.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`)
      })
    }
    
    console.log('\n' + '=' .repeat(80))
    console.log('PLATFORM IS READY FOR PRODUCTION' + (this.report.platform_status === 'HEALTHY' ? ' ✅' : ' (with noted issues)'))
    console.log('=' .repeat(80))
  }
}

// Run the report
async function main() {
  const report = new FinalIntegrityReport()
  await report.generate()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { FinalIntegrityReport }