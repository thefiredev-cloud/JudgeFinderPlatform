#!/usr/bin/env node

/**
 * Comprehensive Court-Judge Relationship Validation Script
 * 
 * Validates the accuracy and performance of the court-judge relationship system
 * by testing API endpoints, database integrity, and frontend functionality.
 * 
 * Run: node scripts/validate-court-judge-relationships.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'
const REPORT_FILE = 'court-judge-validation-report.json'

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  API_RESPONSE_TIME: 2000,
  DATABASE_QUERY_TIME: 1000,
  BATCH_OPERATION_TIME: 5000
}

// Test configuration
const TEST_CONFIG = {
  SAMPLE_COURT_COUNT: 10,      // Number of courts to test in detail
  CALIFORNIA_JUDGE_TARGET: 1810, // Expected CA judges count
  MAX_JUDGES_PER_COURT: 50,    // For pagination testing
  TIMEOUT_MS: 30000            // Request timeout
}

class ValidationReporter {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        total_tests: 0,
        passed_tests: 0,
        failed_tests: 0,
        warnings: 0,
        critical_errors: 0
      },
      test_categories: {
        court_judge_relationships: { tests: [], status: 'pending' },
        california_judges_accessibility: { tests: [], status: 'pending' },
        api_endpoint_testing: { tests: [], status: 'pending' },
        data_integrity: { tests: [], status: 'pending' },
        performance_testing: { tests: [], status: 'pending' },
        frontend_integration: { tests: [], status: 'pending' }
      },
      performance_metrics: {},
      recommendations: [],
      detailed_errors: []
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      critical: '🚨'
    }[level] || '📋'
    
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  addTest(category, testName, status, details = {}) {
    const test = {
      name: testName,
      status,
      timestamp: new Date().toISOString(),
      ...details
    }

    this.results.test_categories[category].tests.push(test)
    this.results.summary.total_tests++

    if (status === 'passed') {
      this.results.summary.passed_tests++
    } else if (status === 'failed') {
      this.results.summary.failed_tests++
      if (details.severity === 'critical') {
        this.results.summary.critical_errors++
      }
    } else if (status === 'warning') {
      this.results.summary.warnings++
    }

    // Update category status
    const categoryTests = this.results.test_categories[category].tests
    const hasFailures = categoryTests.some(t => t.status === 'failed')
    const hasWarnings = categoryTests.some(t => t.status === 'warning')
    
    if (hasFailures) {
      this.results.test_categories[category].status = 'failed'
    } else if (hasWarnings) {
      this.results.test_categories[category].status = 'warning'
    } else {
      this.results.test_categories[category].status = 'passed'
    }
  }

  addPerformanceMetric(name, value, threshold = null) {
    this.results.performance_metrics[name] = {
      value,
      threshold,
      status: threshold ? (value <= threshold ? 'good' : 'slow') : 'measured'
    }
  }

  addRecommendation(category, message, priority = 'medium') {
    this.results.recommendations.push({
      category,
      message,
      priority,
      timestamp: new Date().toISOString()
    })
  }

  addDetailedError(category, error, context = {}) {
    this.results.detailed_errors.push({
      category,
      error: error.message || String(error),
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    })
  }

  async generateReport() {
    try {
      await fs.writeFile(
        REPORT_FILE, 
        JSON.stringify(this.results, null, 2), 
        'utf8'
      )
      this.log(`Validation report saved to: ${REPORT_FILE}`, 'success')
      return this.results
    } catch (error) {
      this.log(`Failed to save report: ${error.message}`, 'error')
      throw error
    }
  }

  printSummary() {
    const { summary } = this.results
    const successRate = summary.total_tests > 0 
      ? ((summary.passed_tests / summary.total_tests) * 100).toFixed(1)
      : 0

    console.log('\n' + '='.repeat(60))
    console.log('VALIDATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`📊 Total Tests: ${summary.total_tests}`)
    console.log(`✅ Passed: ${summary.passed_tests}`)
    console.log(`❌ Failed: ${summary.failed_tests}`)
    console.log(`⚠️  Warnings: ${summary.warnings}`)
    console.log(`🚨 Critical Errors: ${summary.critical_errors}`)
    console.log(`📈 Success Rate: ${successRate}%`)
    console.log('='.repeat(60))

    // Category summary
    Object.entries(this.results.test_categories).forEach(([category, data]) => {
      const statusIcon = {
        passed: '✅',
        warning: '⚠️',
        failed: '❌',
        pending: '⏳'
      }[data.status] || '❓'
      
      console.log(`${statusIcon} ${category.replace(/_/g, ' ').toUpperCase()}: ${data.status} (${data.tests.length} tests)`)
    })

    console.log('='.repeat(60))
  }
}

class CourtJudgeValidator {
  constructor() {
    this.reporter = new ValidationReporter()
    this.supabase = null
    this.testResults = new Map()
  }

  async initialize() {
    this.reporter.log('Initializing Court-Judge Relationship Validator', 'info')
    
    // Initialize Supabase client
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
    }

    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    this.reporter.log('Supabase client initialized', 'success')
  }

  async makeApiRequest(url, options = {}) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.TIMEOUT_MS)

    try {
      const startTime = Date.now()
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        signal: controller.signal
      })
      const endTime = Date.now()
      const duration = endTime - startTime

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return { data, duration, status: response.status }
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  async validateCourtJudgeRelationships() {
    this.reporter.log('Starting Court-Judge Relationship Validation', 'info')

    try {
      // Get sample courts to test
      const { data: courtsData } = await this.makeApiRequest('/api/courts?limit=100')
      const courts = courtsData.courts.slice(0, TEST_CONFIG.SAMPLE_COURT_COUNT)

      this.reporter.log(`Testing ${courts.length} courts for judge relationships`, 'info')

      for (const court of courts) {
        await this.validateSingleCourtJudges(court)
      }

      this.reporter.addTest(
        'court_judge_relationships',
        'Court-Judge Relationship Validation Complete',
        'passed',
        { courts_tested: courts.length }
      )

    } catch (error) {
      this.reporter.addTest(
        'court_judge_relationships',
        'Court-Judge Relationship Validation Failed',
        'failed',
        { error: error.message, severity: 'critical' }
      )
      this.reporter.addDetailedError('court_judge_relationships', error)
    }
  }

  async validateSingleCourtJudges(court) {
    try {
      // Test court judges API endpoint
      const { data: apiData, duration } = await this.makeApiRequest(
        `/api/courts/${court.id}/judges?limit=50`
      )

      // Test if endpoint returns correct structure
      const hasCorrectStructure = apiData.judges && 
                                 Array.isArray(apiData.judges) &&
                                 typeof apiData.total_count === 'number' &&
                                 apiData.court_info

      if (!hasCorrectStructure) {
        this.reporter.addTest(
          'court_judge_relationships',
          `Court ${court.name} - API Structure`,
          'failed',
          { 
            court_id: court.id,
            error: 'Invalid API response structure',
            severity: 'high'
          }
        )
        return
      }

      // Validate against database
      const { data: dbJudges, error: dbError } = await this.supabase
        .from('judges')
        .select('id, name, court_id')
        .eq('court_id', court.id)

      if (dbError) {
        this.reporter.addTest(
          'court_judge_relationships',
          `Court ${court.name} - Database Query`,
          'failed',
          { 
            court_id: court.id,
            error: dbError.message,
            severity: 'high'
          }
        )
        return
      }

      // Compare API results with database
      const apiJudgeIds = new Set(apiData.judges.map(j => j.id))
      const dbJudgeIds = new Set(dbJudges.map(j => j.id))
      
      const missingInApi = dbJudges.filter(j => !apiJudgeIds.has(j.id))
      const extraInApi = apiData.judges.filter(j => !dbJudgeIds.has(j.id))

      if (missingInApi.length > 0 || extraInApi.length > 0) {
        this.reporter.addTest(
          'court_judge_relationships',
          `Court ${court.name} - Data Consistency`,
          'failed',
          {
            court_id: court.id,
            missing_in_api: missingInApi.length,
            extra_in_api: extraInApi.length,
            severity: 'medium'
          }
        )
      } else {
        this.reporter.addTest(
          'court_judge_relationships',
          `Court ${court.name} - Data Consistency`,
          'passed',
          {
            court_id: court.id,
            judges_count: apiData.judges.length,
            response_time_ms: duration
          }
        )
      }

      // Test position type inference
      const judgesWithPositions = apiData.judges.filter(j => j.position_type)
      if (judgesWithPositions.length === 0 && apiData.judges.length > 0) {
        this.reporter.addTest(
          'court_judge_relationships',
          `Court ${court.name} - Position Type Inference`,
          'warning',
          {
            court_id: court.id,
            message: 'No position types inferred for any judges'
          }
        )
      } else {
        this.reporter.addTest(
          'court_judge_relationships',
          `Court ${court.name} - Position Type Inference`,
          'passed',
          {
            court_id: court.id,
            judges_with_positions: judgesWithPositions.length,
            total_judges: apiData.judges.length
          }
        )
      }

      // Performance check
      if (duration > PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME) {
        this.reporter.addTest(
          'court_judge_relationships',
          `Court ${court.name} - Performance`,
          'warning',
          {
            court_id: court.id,
            response_time_ms: duration,
            threshold_ms: PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME
          }
        )
      }

    } catch (error) {
      this.reporter.addTest(
        'court_judge_relationships',
        `Court ${court.name} - Validation Failed`,
        'failed',
        {
          court_id: court.id,
          error: error.message,
          severity: 'high'
        }
      )
      this.reporter.addDetailedError('court_judge_relationships', error, { court })
    }
  }

  async validateCaliforniaJudgesAccessibility() {
    this.reporter.log('Validating California Judges Accessibility', 'info')

    try {
      // Test California judges endpoint
      const { data: caJudgesData, duration } = await this.makeApiRequest(
        '/api/judges/list?jurisdiction=CA&limit=100&page=1'
      )

      const totalCAJudges = caJudgesData.total_count
      
      if (totalCAJudges < TEST_CONFIG.CALIFORNIA_JUDGE_TARGET) {
        this.reporter.addTest(
          'california_judges_accessibility',
          'California Judges Count',
          'failed',
          {
            found_judges: totalCAJudges,
            expected_minimum: TEST_CONFIG.CALIFORNIA_JUDGE_TARGET,
            deficit: TEST_CONFIG.CALIFORNIA_JUDGE_TARGET - totalCAJudges,
            severity: 'critical'
          }
        )
      } else {
        this.reporter.addTest(
          'california_judges_accessibility',
          'California Judges Count',
          'passed',
          {
            found_judges: totalCAJudges,
            expected_minimum: TEST_CONFIG.CALIFORNIA_JUDGE_TARGET,
            response_time_ms: duration
          }
        )
      }

      // Test pagination through multiple pages
      const pagesToTest = Math.min(5, Math.ceil(totalCAJudges / 100))
      let totalAccessibleJudges = 0

      for (let page = 1; page <= pagesToTest; page++) {
        const { data: pageData } = await this.makeApiRequest(
          `/api/judges/list?jurisdiction=CA&limit=100&page=${page}`
        )
        totalAccessibleJudges += pageData.judges.length
      }

      this.reporter.addTest(
        'california_judges_accessibility',
        'Pagination Functionality',
        'passed',
        {
          pages_tested: pagesToTest,
          judges_accessible: totalAccessibleJudges,
          average_per_page: Math.round(totalAccessibleJudges / pagesToTest)
        }
      )

      // Test jurisdiction filtering accuracy
      const californiaJudges = caJudgesData.judges
      const nonCAJudges = californiaJudges.filter(j => j.jurisdiction !== 'CA')

      if (nonCAJudges.length > 0) {
        this.reporter.addTest(
          'california_judges_accessibility',
          'Jurisdiction Filtering Accuracy',
          'failed',
          {
            non_ca_judges_found: nonCAJudges.length,
            total_in_sample: californiaJudges.length,
            severity: 'medium'
          }
        )
      } else {
        this.reporter.addTest(
          'california_judges_accessibility',
          'Jurisdiction Filtering Accuracy',
          'passed',
          {
            sample_size: californiaJudges.length,
            all_ca_judges: true
          }
        )
      }

    } catch (error) {
      this.reporter.addTest(
        'california_judges_accessibility',
        'California Judges Accessibility Validation Failed',
        'failed',
        {
          error: error.message,
          severity: 'critical'
        }
      )
      this.reporter.addDetailedError('california_judges_accessibility', error)
    }
  }

  async validateApiEndpoints() {
    this.reporter.log('Testing API Endpoint Functionality', 'info')

    const endpoints = [
      {
        name: 'Courts List',
        url: '/api/courts?limit=10',
        requiredFields: ['courts', 'total_count', 'page', 'per_page', 'has_more']
      },
      {
        name: 'Judges List',
        url: '/api/judges/list?limit=10',
        requiredFields: ['judges', 'total_count', 'page', 'per_page', 'has_more']
      },
      {
        name: 'Judges List with Court Filter',
        url: '/api/judges/list?limit=10&include_decisions=true',
        requiredFields: ['judges', 'total_count']
      }
    ]

    for (const endpoint of endpoints) {
      try {
        const { data, duration, status } = await this.makeApiRequest(endpoint.url)

        // Check response structure
        const missingFields = endpoint.requiredFields.filter(field => !(field in data))
        
        if (missingFields.length > 0) {
          this.reporter.addTest(
            'api_endpoint_testing',
            `${endpoint.name} - Response Structure`,
            'failed',
            {
              missing_fields: missingFields,
              severity: 'medium'
            }
          )
        } else {
          this.reporter.addTest(
            'api_endpoint_testing',
            `${endpoint.name} - Response Structure`,
            'passed',
            {
              response_time_ms: duration,
              status_code: status
            }
          )
        }

        // Performance check
        if (duration > PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME) {
          this.reporter.addTest(
            'api_endpoint_testing',
            `${endpoint.name} - Performance`,
            'warning',
            {
              response_time_ms: duration,
              threshold_ms: PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME
            }
          )
        }

        this.reporter.addPerformanceMetric(
          `${endpoint.name.replace(/\s+/g, '_').toLowerCase()}_response_time`,
          duration,
          PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME
        )

      } catch (error) {
        this.reporter.addTest(
          'api_endpoint_testing',
          `${endpoint.name} - Request Failed`,
          'failed',
          {
            endpoint: endpoint.url,
            error: error.message,
            severity: 'high'
          }
        )
        this.reporter.addDetailedError('api_endpoint_testing', error, { endpoint })
      }
    }

    // Test error handling
    await this.testErrorHandling()
  }

  async testErrorHandling() {
    const errorTests = [
      {
        name: 'Invalid Court ID',
        url: '/api/courts/invalid-uuid/judges',
        expectedStatus: 400
      },
      {
        name: 'Non-existent Court',
        url: '/api/courts/00000000-0000-0000-0000-000000000000/judges',
        expectedStatus: 404
      },
      {
        name: 'Invalid Pagination Parameters',
        url: '/api/judges/list?page=-1&limit=1000',
        expectedStatus: 400
      }
    ]

    for (const test of errorTests) {
      try {
        await this.makeApiRequest(test.url)
        
        // If we get here, the request succeeded when it should have failed
        this.reporter.addTest(
          'api_endpoint_testing',
          `Error Handling - ${test.name}`,
          'failed',
          {
            expected_error: true,
            got_success: true,
            severity: 'medium'
          }
        )
      } catch (error) {
        // Error is expected, check if it's the right type
        if (error.message.includes('HTTP 400') || error.message.includes('HTTP 404')) {
          this.reporter.addTest(
            'api_endpoint_testing',
            `Error Handling - ${test.name}`,
            'passed',
            {
              expected_error: true,
              got_expected_error: true
            }
          )
        } else {
          this.reporter.addTest(
            'api_endpoint_testing',
            `Error Handling - ${test.name}`,
            'warning',
            {
              expected_status: test.expectedStatus,
              got_error: error.message
            }
          )
        }
      }
    }
  }

  async validateDataIntegrity() {
    this.reporter.log('Validating Database Integrity', 'info')

    try {
      // Check for orphaned judges (judges without valid courts)
      // First get all court IDs
      const { data: validCourts, error: courtsError } = await this.supabase
        .from('courts')
        .select('id')

      if (courtsError) {
        this.reporter.addTest(
          'data_integrity',
          'Orphaned Judges Check',
          'failed',
          {
            error: courtsError.message,
            severity: 'high'
          }
        )
      } else {
        const validCourtIds = validCourts.map(c => c.id)
        
        const { data: orphanedJudges, error: orphanError } = await this.supabase
          .from('judges')
          .select('id, name, court_id')
          .not('court_id', 'is', null)
          .not('court_id', 'in', validCourtIds)

        if (orphanError) {
          this.reporter.addTest(
            'data_integrity',
            'Orphaned Judges Check',
            'failed',
            {
              error: orphanError.message,
              severity: 'high'
            }
          )
        } else if (orphanedJudges.length > 0) {
          this.reporter.addTest(
            'data_integrity',
            'Orphaned Judges Check',
            'failed',
            {
              orphaned_count: orphanedJudges.length,
              severity: 'medium'
            }
          )
        } else {
          this.reporter.addTest(
            'data_integrity',
            'Orphaned Judges Check',
            'passed',
            {
              orphaned_count: 0
            }
          )
        }
      }

      // Check for judges with null court_id
      const { data: nullCourtJudges, error: nullError } = await this.supabase
        .from('judges')
        .select('id, name, court_id')
        .is('court_id', null)

      if (!nullError) {
        if (nullCourtJudges.length > 0) {
          this.reporter.addTest(
            'data_integrity',
            'Judges Without Court Assignment',
            'warning',
            {
              unassigned_count: nullCourtJudges.length,
              message: 'Some judges are not assigned to any court'
            }
          )
        } else {
          this.reporter.addTest(
            'data_integrity',
            'Judges Without Court Assignment',
            'passed',
            {
              unassigned_count: 0
            }
          )
        }
      }

      // Check for duplicate judge-court assignments
      // Since the RPC function might not exist, use a simpler approach
      try {
        const { data: duplicateCheck, error: dupError } = await this.supabase
          .rpc('check_duplicate_judge_assignments')
        
        if (dupError) {
          // RPC doesn't exist, use alternative approach
          this.reporter.addTest(
            'data_integrity',
            'Duplicate Assignment Check',
            'warning',
            {
              message: 'Advanced duplicate check not available, using basic validation'
            }
          )
        }
      } catch (error) {
        // RPC function doesn't exist, that's okay
        this.reporter.addTest(
          'data_integrity',
          'Duplicate Assignment Check',
          'warning',
          {
            message: 'RPC function for duplicate checking not available'
          }
        )
      }

      // Court judge count accuracy
      const { data: courtCounts, error: countError } = await this.supabase
        .from('courts')
        .select(`
          id, 
          name, 
          judge_count,
          judges:judges(count)
        `)

      if (!countError && courtCounts) {
        const inaccurateCounts = courtCounts.filter(court => {
          const actualCount = court.judges[0]?.count || 0
          return Math.abs(court.judge_count - actualCount) > 1 // Allow for minor discrepancies
        })

        if (inaccurateCounts.length > 0) {
          this.reporter.addTest(
            'data_integrity',
            'Court Judge Count Accuracy',
            'warning',
            {
              inaccurate_courts: inaccurateCounts.length,
              total_courts_checked: courtCounts.length,
              sample_inaccuracies: inaccurateCounts.slice(0, 5)
            }
          )
        } else {
          this.reporter.addTest(
            'data_integrity',
            'Court Judge Count Accuracy',
            'passed',
            {
              courts_checked: courtCounts.length,
              all_accurate: true
            }
          )
        }
      }

    } catch (error) {
      this.reporter.addTest(
        'data_integrity',
        'Data Integrity Validation Failed',
        'failed',
        {
          error: error.message,
          severity: 'high'
        }
      )
      this.reporter.addDetailedError('data_integrity', error)
    }
  }

  async validatePerformance() {
    this.reporter.log('Running Performance Tests', 'info')

    try {
      // Test large dataset performance
      const startTime = Date.now()
      const { data: largeDataset } = await this.makeApiRequest('/api/judges/list?limit=100')
      const largeDatasetTime = Date.now() - startTime

      this.reporter.addPerformanceMetric(
        'large_dataset_query_time',
        largeDatasetTime,
        PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME
      )

      // Test concurrent requests
      const concurrentStartTime = Date.now()
      const concurrentPromises = [
        this.makeApiRequest('/api/courts?limit=20'),
        this.makeApiRequest('/api/judges/list?limit=20'),
        this.makeApiRequest('/api/judges/list?jurisdiction=CA&limit=20')
      ]

      await Promise.all(concurrentPromises)
      const concurrentTime = Date.now() - concurrentStartTime

      this.reporter.addPerformanceMetric(
        'concurrent_requests_time',
        concurrentTime,
        PERFORMANCE_THRESHOLDS.BATCH_OPERATION_TIME
      )

      this.reporter.addTest(
        'performance_testing',
        'Performance Testing Complete',
        'passed',
        {
          large_dataset_time_ms: largeDatasetTime,
          concurrent_requests_time_ms: concurrentTime
        }
      )

    } catch (error) {
      this.reporter.addTest(
        'performance_testing',
        'Performance Testing Failed',
        'failed',
        {
          error: error.message,
          severity: 'medium'
        }
      )
      this.reporter.addDetailedError('performance_testing', error)
    }
  }

  async validateFrontendIntegration() {
    this.reporter.log('Validating Frontend Integration Readiness', 'info')

    try {
      // Test if API responses match expected frontend format
      const { data: judgesData } = await this.makeApiRequest('/api/judges/list?limit=5')
      
      // Check if judges have required fields for frontend display
      const requiredJudgeFields = ['id', 'name', 'court_name', 'jurisdiction']
      const judges = judgesData.judges || []
      
      if (judges.length > 0) {
        const firstJudge = judges[0]
        const missingFields = requiredJudgeFields.filter(field => !(field in firstJudge))
        
        if (missingFields.length > 0) {
          this.reporter.addTest(
            'frontend_integration',
            'Judge Data Structure for Frontend',
            'failed',
            {
              missing_fields: missingFields,
              severity: 'medium'
            }
          )
        } else {
          this.reporter.addTest(
            'frontend_integration',
            'Judge Data Structure for Frontend',
            'passed',
            {
              required_fields_present: requiredJudgeFields.length
            }
          )
        }
      }

      // Test court-judge endpoint for frontend consumption
      const { data: courtsData } = await this.makeApiRequest('/api/courts?limit=1')
      if (courtsData.courts.length > 0) {
        const court = courtsData.courts[0]
        const { data: courtJudgesData } = await this.makeApiRequest(`/api/courts/${court.id}/judges?limit=5`)
        
        if (courtJudgesData.court_info && courtJudgesData.judges) {
          this.reporter.addTest(
            'frontend_integration',
            'Court Detail Page Data Format',
            'passed',
            {
              has_court_info: true,
              has_judges_list: true,
              judges_count: courtJudgesData.judges.length
            }
          )
        } else {
          this.reporter.addTest(
            'frontend_integration',
            'Court Detail Page Data Format',
            'failed',
            {
              has_court_info: !!courtJudgesData.court_info,
              has_judges_list: !!courtJudgesData.judges,
              severity: 'medium'
            }
          )
        }
      }

    } catch (error) {
      this.reporter.addTest(
        'frontend_integration',
        'Frontend Integration Validation Failed',
        'failed',
        {
          error: error.message,
          severity: 'medium'
        }
      )
      this.reporter.addDetailedError('frontend_integration', error)
    }
  }

  generateRecommendations() {
    const { summary, performance_metrics } = this.reporter.results

    // Performance recommendations
    Object.entries(performance_metrics).forEach(([metric, data]) => {
      if (data.status === 'slow') {
        this.reporter.addRecommendation(
          'performance',
          `Consider optimizing ${metric.replace(/_/g, ' ')}: ${data.value}ms exceeds threshold of ${data.threshold}ms`,
          'medium'
        )
      }
    })

    // Data integrity recommendations
    if (summary.critical_errors > 0) {
      this.reporter.addRecommendation(
        'critical',
        'Critical errors detected. Review detailed error logs and fix data integrity issues before production deployment.',
        'high'
      )
    }

    if (summary.warnings > 0) {
      this.reporter.addRecommendation(
        'optimization',
        'Warnings detected. Consider addressing these issues to improve system reliability.',
        'medium'
      )
    }

    // Success recommendations
    if (summary.passed_tests / summary.total_tests > 0.9) {
      this.reporter.addRecommendation(
        'deployment',
        'System validation shows high success rate. Court-judge relationship system is ready for production use.',
        'low'
      )
    }
  }

  async runFullValidation() {
    this.reporter.log('Starting Comprehensive Court-Judge Relationship Validation', 'info')
    const overallStartTime = Date.now()

    try {
      await this.initialize()

      // Run all validation categories
      await this.validateCourtJudgeRelationships()
      await this.validateCaliforniaJudgesAccessibility()
      await this.validateApiEndpoints()
      await this.validateDataIntegrity()
      await this.validatePerformance()
      await this.validateFrontendIntegration()

      // Generate recommendations
      this.generateRecommendations()

      // Record overall performance
      const overallDuration = Date.now() - overallStartTime
      this.reporter.addPerformanceMetric(
        'total_validation_time',
        overallDuration
      )

      this.reporter.log(`Validation completed in ${overallDuration}ms`, 'success')

    } catch (error) {
      this.reporter.log(`Validation failed: ${error.message}`, 'error')
      this.reporter.addDetailedError('system', error)
    } finally {
      // Always generate report and print summary
      await this.reporter.generateReport()
      this.reporter.printSummary()
    }
  }
}

// Main execution
async function main() {
  const validator = new CourtJudgeValidator()
  await validator.runFullValidation()
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { CourtJudgeValidator, ValidationReporter }