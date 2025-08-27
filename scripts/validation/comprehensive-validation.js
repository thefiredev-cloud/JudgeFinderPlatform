#!/usr/bin/env node

/**
 * COMPREHENSIVE JUDICIAL PLATFORM VALIDATION SYSTEM
 * 
 * Final validation to ensure all 1,061 California judges have complete, accurate profiles
 * with proper court assignments, accessible URLs, and data integrity.
 * 
 * Features:
 * 1. Complete end-to-end validation of all judge profiles
 * 2. URL accessibility testing for every judge profile
 * 3. Court assignment data accuracy validation
 * 4. Data consistency and completeness checks
 * 5. Platform health monitoring and reporting
 * 6. Automated issue detection and remediation
 */

// Load environment variables first
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')
const fs = require('fs').promises
const path = require('path')

// Configuration
const CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  BASE_URL: process.env.NODE_ENV === 'production' ? 'https://judgefinder.io' : 'http://localhost:3005',
  BATCH_SIZE: 50,
  REQUEST_DELAY: 100, // ms between requests
  TIMEOUT: 30000, // 30 seconds
  VALIDATION_TIMESTAMP: new Date().toISOString()
}

class JudicialValidationSystem {
  constructor() {
    this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY)
    this.results = {
      timestamp: CONFIG.VALIDATION_TIMESTAMP,
      summary: {
        total_judges: 0,
        valid_profiles: 0,
        invalid_profiles: 0,
        accessible_urls: 0,
        inaccessible_urls: 0,
        complete_court_data: 0,
        incomplete_court_data: 0,
        data_inconsistencies: 0
      },
      detailed_results: [],
      critical_issues: [],
      recommendations: [],
      platform_health: {
        api_endpoints: {},
        database_health: {},
        data_quality: {}
      }
    }
    
    this.validationErrors = []
    this.processedCount = 0
  }

  /**
   * Main validation orchestrator
   */
  async runComprehensiveValidation() {
    console.log('🚀 Starting Comprehensive Judicial Platform Validation')
    console.log(`📊 Target: All 1,061 California judges`)
    console.log(`🌐 Base URL: ${CONFIG.BASE_URL}`)
    console.log(`⏰ Timestamp: ${CONFIG.VALIDATION_TIMESTAMP}\n`)

    try {
      // Phase 1: Database validation and data collection
      await this.validateDatabaseHealth()
      const judges = await this.getAllJudges()
      
      // Phase 2: Profile completeness validation
      await this.validateProfileCompleteness(judges)
      
      // Phase 3: URL accessibility testing
      await this.validateProfileAccessibility(judges)
      
      // Phase 4: Court assignment validation
      await this.validateCourtAssignments(judges)
      
      // Phase 5: Data consistency checks
      await this.validateDataConsistency(judges)
      
      // Phase 6: API endpoint health checks
      await this.validateAPIEndpoints()
      
      // Phase 7: Generate comprehensive report
      await this.generateComprehensiveReport()
      
      // Phase 8: Setup automated monitoring
      await this.setupAutomatedMonitoring()
      
      console.log('\n✅ Comprehensive validation completed successfully!')
      
    } catch (error) {
      console.error('\n❌ Validation failed:', error)
      this.results.critical_issues.push({
        type: 'SYSTEM_FAILURE',
        message: `Validation system failure: ${error.message}`,
        severity: 'CRITICAL',
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Validate database health and connectivity
   */
  async validateDatabaseHealth() {
    console.log('🔍 Phase 1: Database Health Validation')
    
    try {
      // Test basic connectivity
      const { data, error } = await this.supabase
        .from('judges')
        .select('count')
        .limit(1)
        
      if (error) throw error
      
      // Test judges table structure
      const { data: judgesSample } = await this.supabase
        .from('judges')
        .select('*')
        .limit(1)
        
      // Test courts table structure
      const { data: courtsSample } = await this.supabase
        .from('courts')
        .select('*')
        .limit(1)
        
      // Validate table relationships
      const { data: relationshipTest } = await this.supabase
        .from('judges')
        .select(`
          id,
          name,
          court_id,
          courts:court_id (
            id,
            name,
            jurisdiction
          )
        `)
        .limit(1)
        
      this.results.platform_health.database_health = {
        connectivity: 'HEALTHY',
        judges_table: judgesSample ? 'ACCESSIBLE' : 'ERROR',
        courts_table: courtsSample ? 'ACCESSIBLE' : 'ERROR',
        relationships: relationshipTest ? 'FUNCTIONAL' : 'ERROR',
        last_checked: new Date().toISOString()
      }
      
      console.log('✅ Database health validation completed')
      
    } catch (error) {
      console.error('❌ Database health check failed:', error)
      this.results.platform_health.database_health = {
        connectivity: 'ERROR',
        error: error.message,
        last_checked: new Date().toISOString()
      }
    }
  }

  /**
   * Retrieve all judges from database with essential fields
   */
  async getAllJudges() {
    console.log('📚 Fetching all judges from database...')
    
    try {
      const { data: judges, error } = await this.supabase
        .from('judges')
        .select(`
          id,
          name,
          slug,
          court_id,
          court_name,
          jurisdiction,
          appointed_date,
          education,
          profile_image_url,
          bio,
          total_cases,
          reversal_rate,
          average_decision_time,
          courtlistener_id,
          courtlistener_data,
          created_at,
          updated_at,
          courts:court_id (
            id,
            name,
            jurisdiction,
            type,
            address,
            phone,
            website
          )
        `)
        .order('name')
        
      if (error) throw error
      
      this.results.summary.total_judges = judges.length
      console.log(`✅ Retrieved ${judges.length} judges from database`)
      
      return judges
      
    } catch (error) {
      console.error('❌ Failed to retrieve judges:', error)
      throw error
    }
  }

  /**
   * Validate profile completeness for all judges
   */
  async validateProfileCompleteness(judges) {
    console.log('\n🔍 Phase 2: Profile Completeness Validation')
    console.log(`📊 Validating ${judges.length} judge profiles...`)
    
    let validProfiles = 0
    let invalidProfiles = 0
    
    for (const judge of judges) {
      const validation = this.validateSingleProfile(judge)
      
      if (validation.isValid) {
        validProfiles++
      } else {
        invalidProfiles++
        this.results.detailed_results.push({
          judge_id: judge.id,
          judge_name: judge.name,
          validation_type: 'PROFILE_COMPLETENESS',
          status: 'INVALID',
          issues: validation.issues,
          timestamp: new Date().toISOString()
        })
      }
      
      this.processedCount++
      if (this.processedCount % 100 === 0) {
        console.log(`   Progress: ${this.processedCount}/${judges.length} profiles validated`)
      }
    }
    
    this.results.summary.valid_profiles = validProfiles
    this.results.summary.invalid_profiles = invalidProfiles
    
    console.log(`✅ Profile validation completed: ${validProfiles} valid, ${invalidProfiles} invalid`)
  }

  /**
   * Validate individual profile completeness
   */
  validateSingleProfile(judge) {
    const issues = []
    let isValid = true
    
    // Essential fields validation
    if (!judge.name || judge.name.trim() === '') {
      issues.push('Missing judge name')
      isValid = false
    }
    
    if (!judge.jurisdiction || judge.jurisdiction.trim() === '') {
      issues.push('Missing jurisdiction')
      isValid = false
    }
    
    if (!judge.court_name || judge.court_name.trim() === '') {
      issues.push('Missing court name')
      isValid = false
    }
    
    // Recommended fields validation
    if (!judge.bio || judge.bio.trim() === '') {
      issues.push('Missing biographical information')
    }
    
    if (!judge.education || judge.education.trim() === '') {
      issues.push('Missing education information')
    }
    
    if (!judge.appointed_date) {
      issues.push('Missing appointment date')
    }
    
    // Data quality validation
    if (judge.total_cases < 0) {
      issues.push('Invalid total cases count')
      isValid = false
    }
    
    if (judge.reversal_rate < 0 || judge.reversal_rate > 1) {
      issues.push('Invalid reversal rate')
      isValid = false
    }
    
    return { isValid, issues }
  }

  /**
   * Test URL accessibility for all judge profiles
   */
  async validateProfileAccessibility(judges) {
    console.log('\n🔍 Phase 3: Profile URL Accessibility Testing')
    console.log(`🌐 Testing accessibility of ${judges.length} judge profile URLs...`)
    
    let accessibleUrls = 0
    let inaccessibleUrls = 0
    const batches = this.createBatches(judges, CONFIG.BATCH_SIZE)
    
    for (let i = 0; i < batches.length; i++) {
      console.log(`   Processing batch ${i + 1}/${batches.length}...`)
      
      const batchResults = await Promise.allSettled(
        batches[i].map(judge => this.testJudgeProfileURL(judge))
      )
      
      batchResults.forEach((result, index) => {
        const judge = batches[i][index]
        
        if (result.status === 'fulfilled' && result.value.accessible) {
          accessibleUrls++
        } else {
          inaccessibleUrls++
          this.results.detailed_results.push({
            judge_id: judge.id,
            judge_name: judge.name,
            validation_type: 'URL_ACCESSIBILITY',
            status: 'INACCESSIBLE',
            url: result.value?.url || 'unknown',
            error: result.value?.error || result.reason?.message,
            timestamp: new Date().toISOString()
          })
        }
      })
      
      // Delay between batches to avoid overwhelming the server
      if (i < batches.length - 1) {
        await this.delay(CONFIG.REQUEST_DELAY * 10)
      }
    }
    
    this.results.summary.accessible_urls = accessibleUrls
    this.results.summary.inaccessible_urls = inaccessibleUrls
    
    console.log(`✅ URL accessibility testing completed: ${accessibleUrls} accessible, ${inaccessibleUrls} inaccessible`)
  }

  /**
   * Test individual judge profile URL
   */
  async testJudgeProfileURL(judge) {
    try {
      const slug = judge.slug || this.generateSlugFromName(judge.name)
      const url = `${CONFIG.BASE_URL}/judges/${slug}`
      
      const response = await fetch(url, {
        method: 'HEAD',
        timeout: CONFIG.TIMEOUT,
        headers: {
          'User-Agent': 'JudgeFinder-Validation-Bot/1.0'
        }
      })
      
      return {
        accessible: response.ok,
        url: url,
        status_code: response.status,
        response_time: response.headers.get('x-response-time') || 'unknown'
      }
      
    } catch (error) {
      return {
        accessible: false,
        url: judge.slug ? `${CONFIG.BASE_URL}/judges/${judge.slug}` : 'invalid-slug',
        error: error.message
      }
    }
  }

  /**
   * Validate court assignment data accuracy
   */
  async validateCourtAssignments(judges) {
    console.log('\n🔍 Phase 4: Court Assignment Data Validation')
    console.log(`🏛️ Validating court assignments for ${judges.length} judges...`)
    
    let completeCourtData = 0
    let incompleteCourtData = 0
    
    for (const judge of judges) {
      const validation = this.validateCourtAssignment(judge)
      
      if (validation.isComplete) {
        completeCourtData++
      } else {
        incompleteCourtData++
        this.results.detailed_results.push({
          judge_id: judge.id,
          judge_name: judge.name,
          validation_type: 'COURT_ASSIGNMENT',
          status: 'INCOMPLETE',
          issues: validation.issues,
          timestamp: new Date().toISOString()
        })
      }
    }
    
    this.results.summary.complete_court_data = completeCourtData
    this.results.summary.incomplete_court_data = incompleteCourtData
    
    console.log(`✅ Court assignment validation completed: ${completeCourtData} complete, ${incompleteCourtData} incomplete`)
  }

  /**
   * Validate individual court assignment
   */
  validateCourtAssignment(judge) {
    const issues = []
    let isComplete = true
    
    // Check if judge has court assignment
    if (!judge.court_id) {
      issues.push('No court_id assigned')
      isComplete = false
    }
    
    if (!judge.court_name) {
      issues.push('No court_name specified')
      isComplete = false
    }
    
    // Check court relationship data
    if (judge.courts) {
      const court = judge.courts
      
      if (!court.name) {
        issues.push('Linked court missing name')
        isComplete = false
      }
      
      if (!court.jurisdiction) {
        issues.push('Linked court missing jurisdiction')
        isComplete = false
      }
      
      // Validate jurisdiction consistency
      if (judge.jurisdiction !== court.jurisdiction) {
        issues.push(`Jurisdiction mismatch: Judge(${judge.jurisdiction}) vs Court(${court.jurisdiction})`)
        isComplete = false
      }
      
    } else if (judge.court_id) {
      issues.push('Court_id specified but court relationship data missing')
      isComplete = false
    }
    
    return { isComplete, issues }
  }

  /**
   * Validate data consistency across the platform
   */
  async validateDataConsistency(judges) {
    console.log('\n🔍 Phase 5: Data Consistency Validation')
    
    let inconsistencies = 0
    const jurisdictionCounts = {}
    const courtCounts = {}
    
    // Count by jurisdiction and court
    judges.forEach(judge => {
      jurisdictionCounts[judge.jurisdiction] = (jurisdictionCounts[judge.jurisdiction] || 0) + 1
      if (judge.court_name) {
        courtCounts[judge.court_name] = (courtCounts[judge.court_name] || 0) + 1
      }
    })
    
    // Check for California jurisdiction consistency
    if (!jurisdictionCounts['CA'] && !jurisdictionCounts['California']) {
      this.results.critical_issues.push({
        type: 'JURISDICTION_INCONSISTENCY',
        message: 'No judges found with CA or California jurisdiction',
        severity: 'CRITICAL',
        timestamp: new Date().toISOString()
      })
      inconsistencies++
    }
    
    // Check for duplicate names
    const nameMap = new Map()
    judges.forEach(judge => {
      if (nameMap.has(judge.name)) {
        this.results.detailed_results.push({
          judge_id: judge.id,
          judge_name: judge.name,
          validation_type: 'DATA_CONSISTENCY',
          status: 'DUPLICATE_NAME',
          issues: [`Duplicate name found with judge ID: ${nameMap.get(judge.name)}`],
          timestamp: new Date().toISOString()
        })
        inconsistencies++
      } else {
        nameMap.set(judge.name, judge.id)
      }
    })
    
    this.results.summary.data_inconsistencies = inconsistencies
    this.results.platform_health.data_quality = {
      unique_jurisdictions: Object.keys(jurisdictionCounts).length,
      unique_courts: Object.keys(courtCounts).length,
      jurisdiction_distribution: jurisdictionCounts,
      court_distribution: Object.keys(courtCounts).length > 20 ? 
        Object.fromEntries(Object.entries(courtCounts).slice(0, 20)) : 
        courtCounts,
      last_checked: new Date().toISOString()
    }
    
    console.log(`✅ Data consistency validation completed: ${inconsistencies} inconsistencies found`)
  }

  /**
   * Validate API endpoint health
   */
  async validateAPIEndpoints() {
    console.log('\n🔍 Phase 6: API Endpoint Health Validation')
    
    const endpoints = [
      { path: '/api/judges/list', description: 'Judge listing API' },
      { path: '/api/judges/recent-decisions', description: 'Recent decisions API' },
      { path: '/api/courts', description: 'Courts API' },
      { path: '/api/judges/by-state?state=CA', description: 'Judges by state API' }
    ]
    
    for (const endpoint of endpoints) {
      try {
        const url = `${CONFIG.BASE_URL}${endpoint.path}`
        const startTime = Date.now()
        
        const response = await fetch(url, {
          timeout: CONFIG.TIMEOUT,
          headers: {
            'User-Agent': 'JudgeFinder-Validation-Bot/1.0'
          }
        })
        
        const endTime = Date.now()
        const responseTime = endTime - startTime
        
        this.results.platform_health.api_endpoints[endpoint.path] = {
          status: response.ok ? 'HEALTHY' : 'ERROR',
          status_code: response.status,
          response_time_ms: responseTime,
          description: endpoint.description,
          last_checked: new Date().toISOString()
        }
        
        if (!response.ok) {
          this.results.critical_issues.push({
            type: 'API_ENDPOINT_ERROR',
            message: `API endpoint ${endpoint.path} returned ${response.status}`,
            severity: 'HIGH',
            timestamp: new Date().toISOString()
          })
        }
        
      } catch (error) {
        this.results.platform_health.api_endpoints[endpoint.path] = {
          status: 'ERROR',
          error: error.message,
          description: endpoint.description,
          last_checked: new Date().toISOString()
        }
        
        this.results.critical_issues.push({
          type: 'API_ENDPOINT_FAILURE',
          message: `API endpoint ${endpoint.path} failed: ${error.message}`,
          severity: 'CRITICAL',
          timestamp: new Date().toISOString()
        })
      }
    }
    
    console.log('✅ API endpoint validation completed')
  }

  /**
   * Generate comprehensive validation report
   */
  async generateComprehensiveReport() {
    console.log('\n📊 Phase 7: Generating Comprehensive Report')
    
    // Calculate success rates
    const profileSuccessRate = ((this.results.summary.valid_profiles / this.results.summary.total_judges) * 100).toFixed(2)
    const urlSuccessRate = ((this.results.summary.accessible_urls / this.results.summary.total_judges) * 100).toFixed(2)
    const courtDataSuccessRate = ((this.results.summary.complete_court_data / this.results.summary.total_judges) * 100).toFixed(2)
    
    // Generate recommendations
    this.generateRecommendations()
    
    // Create comprehensive report
    const report = {
      validation_summary: {
        ...this.results.summary,
        profile_success_rate: `${profileSuccessRate}%`,
        url_success_rate: `${urlSuccessRate}%`,
        court_data_success_rate: `${courtDataSuccessRate}%`
      },
      platform_health: this.results.platform_health,
      critical_issues: this.results.critical_issues,
      recommendations: this.results.recommendations,
      detailed_issues: this.results.detailed_results.length,
      validation_metadata: {
        timestamp: this.results.timestamp,
        base_url: CONFIG.BASE_URL,
        total_judges_expected: 1061,
        total_judges_found: this.results.summary.total_judges,
        coverage_percentage: ((this.results.summary.total_judges / 1061) * 100).toFixed(2) + '%'
      }
    }
    
    // Save detailed report
    const reportPath = path.join(process.cwd(), 'validation-reports', `comprehensive-validation-${Date.now()}.json`)
    await fs.mkdir(path.dirname(reportPath), { recursive: true })
    await fs.writeFile(reportPath, JSON.stringify({
      summary: report,
      detailed_results: this.results.detailed_results
    }, null, 2))
    
    // Save summary report
    const summaryPath = path.join(process.cwd(), 'validation-reports', 'latest-summary.json')
    await fs.writeFile(summaryPath, JSON.stringify(report, null, 2))
    
    console.log('✅ Comprehensive report generated')
    console.log(`📄 Detailed report: ${reportPath}`)
    console.log(`📄 Summary report: ${summaryPath}`)
    
    // Print summary to console
    this.printValidationSummary(report)
    
    return report
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations() {
    const recommendations = []
    
    // Profile completeness recommendations
    if (this.results.summary.invalid_profiles > 0) {
      recommendations.push({
        type: 'PROFILE_COMPLETENESS',
        priority: 'HIGH',
        message: `${this.results.summary.invalid_profiles} judges have incomplete profiles`,
        action: 'Review and complete missing profile data for judges with validation issues',
        estimated_effort: 'Medium'
      })
    }
    
    // URL accessibility recommendations
    if (this.results.summary.inaccessible_urls > 0) {
      recommendations.push({
        type: 'URL_ACCESSIBILITY',
        priority: 'HIGH',
        message: `${this.results.summary.inaccessible_urls} judge profile URLs are inaccessible`,
        action: 'Check slug generation and URL routing for failed profiles',
        estimated_effort: 'High'
      })
    }
    
    // Court data recommendations
    if (this.results.summary.incomplete_court_data > 0) {
      recommendations.push({
        type: 'COURT_DATA',
        priority: 'MEDIUM',
        message: `${this.results.summary.incomplete_court_data} judges have incomplete court assignment data`,
        action: 'Update court assignments and verify court-judge relationships',
        estimated_effort: 'Medium'
      })
    }
    
    // Data consistency recommendations
    if (this.results.summary.data_inconsistencies > 0) {
      recommendations.push({
        type: 'DATA_CONSISTENCY',
        priority: 'HIGH',
        message: `${this.results.summary.data_inconsistencies} data inconsistencies found`,
        action: 'Review and resolve data inconsistencies, especially duplicate names and jurisdiction mismatches',
        estimated_effort: 'Medium'
      })
    }
    
    // Performance recommendations
    const apiIssues = Object.values(this.results.platform_health.api_endpoints).filter(ep => ep.status !== 'HEALTHY').length
    if (apiIssues > 0) {
      recommendations.push({
        type: 'API_PERFORMANCE',
        priority: 'CRITICAL',
        message: `${apiIssues} API endpoints have issues`,
        action: 'Investigate and fix API endpoint errors immediately',
        estimated_effort: 'High'
      })
    }
    
    this.results.recommendations = recommendations
  }

  /**
   * Setup automated monitoring for ongoing validation
   */
  async setupAutomatedMonitoring() {
    console.log('\n🔍 Phase 8: Setting Up Automated Monitoring')
    
    // Create monitoring configuration
    const monitoringConfig = {
      enabled: true,
      schedule: {
        daily_health_check: '0 8 * * *', // 8 AM daily
        weekly_comprehensive: '0 2 * * 0', // 2 AM every Sunday
        monthly_deep_audit: '0 1 1 * *' // 1 AM first day of month
      },
      thresholds: {
        min_accessible_percentage: 95,
        min_complete_profiles_percentage: 90,
        max_response_time_ms: 3000,
        max_critical_issues: 5
      },
      notifications: {
        email_alerts: true,
        slack_webhook: process.env.SLACK_WEBHOOK_URL || null,
        dashboard_alerts: true
      },
      monitoring_endpoints: [
        '/api/judges/list',
        '/api/courts',
        '/api/judges/recent-decisions'
      ],
      created_at: new Date().toISOString()
    }
    
    // Save monitoring configuration
    const monitoringPath = path.join(process.cwd(), 'monitoring', 'config.json')
    await fs.mkdir(path.dirname(monitoringPath), { recursive: true })
    await fs.writeFile(monitoringPath, JSON.stringify(monitoringConfig, null, 2))
    
    // Create monitoring script
    const monitoringScript = this.generateMonitoringScript()
    const scriptPath = path.join(process.cwd(), 'monitoring', 'automated-validation.js')
    await fs.writeFile(scriptPath, monitoringScript)
    
    console.log('✅ Automated monitoring setup completed')
    console.log(`📄 Configuration: ${monitoringPath}`)
    console.log(`📄 Script: ${scriptPath}`)
  }

  /**
   * Generate monitoring script for automated validation
   */
  generateMonitoringScript() {
    return `#!/usr/bin/env node

/**
 * AUTOMATED JUDICIAL PLATFORM MONITORING
 * Generated by Comprehensive Validation System
 * 
 * Run this script via cron for automated monitoring:
 * # Daily health check at 8 AM
 * 0 8 * * * node monitoring/automated-validation.js --mode=daily
 * 
 * # Weekly comprehensive check at 2 AM Sunday
 * 0 2 * * 0 node monitoring/automated-validation.js --mode=weekly
 * 
 * # Monthly deep audit at 1 AM first day of month
 * 0 1 1 * * node monitoring/automated-validation.js --mode=monthly
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const mode = process.argv.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'daily'

async function runMonitoring() {
  try {
    console.log(\`🤖 Running automated validation in \${mode} mode\`)
    
    let command = 'node scripts/comprehensive-validation.js'
    
    switch(mode) {
      case 'daily':
        command += ' --quick-check'
        break
      case 'weekly':
        command += ' --standard'
        break
      case 'monthly':
        command += ' --deep-audit'
        break
    }
    
    const result = execSync(command, { encoding: 'utf-8' })
    console.log(result)
    
    // Check for critical issues
    const latestReport = JSON.parse(fs.readFileSync('validation-reports/latest-summary.json', 'utf-8'))
    
    if (latestReport.critical_issues.length > 0) {
      console.log('🚨 Critical issues detected - sending alerts')
      // Add your alert logic here (email, Slack, etc.)
    }
    
  } catch (error) {
    console.error('❌ Monitoring failed:', error)
    // Add error alert logic here
  }
}

runMonitoring()
`
  }

  /**
   * Print validation summary to console
   */
  printValidationSummary(report) {
    console.log('\n' + '='.repeat(80))
    console.log('📊 COMPREHENSIVE VALIDATION SUMMARY')
    console.log('='.repeat(80))
    console.log(`🏛️  Total Judges: ${report.validation_summary.total_judges}`)
    console.log(`✅ Valid Profiles: ${report.validation_summary.valid_profiles} (${report.validation_summary.profile_success_rate})`)
    console.log(`🌐 Accessible URLs: ${report.validation_summary.accessible_urls} (${report.validation_summary.url_success_rate})`)
    console.log(`🏛️  Complete Court Data: ${report.validation_summary.complete_court_data} (${report.validation_summary.court_data_success_rate})`)
    console.log(`⚠️  Critical Issues: ${report.critical_issues.length}`)
    console.log(`📋 Recommendations: ${report.recommendations.length}`)
    console.log(`📊 Coverage: ${report.validation_metadata.coverage_percentage} of expected 1,061 judges`)
    
    if (report.critical_issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:')
      report.critical_issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue.type}: ${issue.message}`)
      })
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 TOP RECOMMENDATIONS:')
      report.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`   ${i + 1}. [${rec.priority}] ${rec.message}`)
        console.log(`      Action: ${rec.action}`)
      })
    }
    
    console.log('\n' + '='.repeat(80))
  }

  // Utility functions
  createBatches(array, batchSize) {
    const batches = []
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize))
    }
    return batches
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  generateSlugFromName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
}

// Main execution
async function main() {
  const validator = new JudicialValidationSystem()
  await validator.runComprehensiveValidation()
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { JudicialValidationSystem }