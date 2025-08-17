#!/usr/bin/env node

/**
 * SPECIALIZED URL ACCESSIBILITY TESTING
 * 
 * Tests every judge profile URL to ensure all 1,061 judges are accessible
 * Generates detailed accessibility report with performance metrics
 */

const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')
const fs = require('fs').promises
const path = require('path')

const CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awqrfxrwnslqsnrrwuaz.supabase.co',
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  BASE_URL: process.env.NODE_ENV === 'production' ? 'https://judgefinder.io' : 'http://localhost:3005',
  CONCURRENT_REQUESTS: 10,
  REQUEST_TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
}

class URLAccessibilityTester {
  constructor() {
    this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY)
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        total_urls_tested: 0,
        accessible_urls: 0,
        inaccessible_urls: 0,
        average_response_time: 0,
        fastest_response: 0,
        slowest_response: 0
      },
      detailed_results: [],
      accessibility_issues: [],
      performance_metrics: {},
      slug_generation_issues: []
    }
  }

  async runAccessibilityTest() {
    console.log('🌐 Starting URL Accessibility Test for All Judge Profiles')
    console.log(`🎯 Base URL: ${CONFIG.BASE_URL}`)
    console.log(`⚡ Concurrent Requests: ${CONFIG.CONCURRENT_REQUESTS}`)
    console.log(`⏱️  Timeout: ${CONFIG.REQUEST_TIMEOUT}ms\n`)

    try {
      // Get all judges
      const judges = await this.getAllJudges()
      
      // Test URL accessibility
      await this.testAllJudgeURLs(judges)
      
      // Generate accessibility report
      await this.generateAccessibilityReport()
      
      console.log('\n✅ URL accessibility testing completed!')
      
    } catch (error) {
      console.error('❌ Accessibility testing failed:', error)
    }
  }

  async getAllJudges() {
    console.log('📚 Fetching all judges...')
    
    const { data: judges, error } = await this.supabase
      .from('judges')
      .select('id, name, slug, jurisdiction, court_name')
      .order('name')
      
    if (error) throw error
    
    console.log(`✅ Retrieved ${judges.length} judges`)
    return judges
  }

  async testAllJudgeURLs(judges) {
    console.log(`🔍 Testing ${judges.length} judge profile URLs...`)
    
    const responseTimes = []
    const batches = this.createBatches(judges, CONFIG.CONCURRENT_REQUESTS)
    
    for (let i = 0; i < batches.length; i++) {
      console.log(`   Batch ${i + 1}/${batches.length} (${batches[i].length} URLs)`)
      
      const batchPromises = batches[i].map(judge => this.testSingleURL(judge))
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result, index) => {
        const judge = batches[i][index]
        
        if (result.status === 'fulfilled') {
          const testResult = result.value
          this.results.detailed_results.push(testResult)
          
          if (testResult.accessible) {
            this.results.summary.accessible_urls++
            if (testResult.response_time) {
              responseTimes.push(testResult.response_time)
            }
          } else {
            this.results.summary.inaccessible_urls++
            this.results.accessibility_issues.push({
              judge_id: judge.id,
              judge_name: judge.name,
              url: testResult.url,
              error: testResult.error,
              status_code: testResult.status_code,
              accessibility_issues: testResult.accessibility_issues || []
            })
          }
        } else {
          this.results.summary.inaccessible_urls++
          this.results.accessibility_issues.push({
            judge_id: judge.id,
            judge_name: judge.name,
            url: 'unknown',
            error: result.reason?.message || 'Unknown error',
            status_code: null
          })
        }
      })
      
      // Progress update
      const tested = (i + 1) * CONFIG.CONCURRENT_REQUESTS
      const total = judges.length
      console.log(`   Progress: ${Math.min(tested, total)}/${total} URLs tested`)
      
      // Small delay between batches
      if (i < batches.length - 1) {
        await this.delay(100)
      }
    }
    
    // Calculate performance metrics
    this.results.summary.total_urls_tested = judges.length
    if (responseTimes.length > 0) {
      this.results.summary.average_response_time = Math.round(
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      )
      this.results.summary.fastest_response = Math.min(...responseTimes)
      this.results.summary.slowest_response = Math.max(...responseTimes)
    }
    
    console.log(`✅ URL testing completed: ${this.results.summary.accessible_urls} accessible, ${this.results.summary.inaccessible_urls} inaccessible`)
  }

  async testSingleURL(judge) {
    const testResult = {
      judge_id: judge.id,
      judge_name: judge.name,
      url: null,
      accessible: false,
      status_code: null,
      response_time: null,
      error: null,
      accessibility_issues: [],
      retries_used: 0
    }

    try {
      // Generate or use existing slug
      const slug = judge.slug || this.generateSlugFromName(judge.name)
      testResult.url = `${CONFIG.BASE_URL}/judges/${slug}`
      
      // Validate slug format
      if (!this.isValidSlug(slug)) {
        testResult.error = 'Invalid slug format'
        this.results.slug_generation_issues.push({
          judge_id: judge.id,
          judge_name: judge.name,
          generated_slug: slug,
          issue: 'Invalid format'
        })
        return testResult
      }
      
      // Test URL with retries
      let lastError = null
      for (let attempt = 0; attempt < CONFIG.RETRY_ATTEMPTS; attempt++) {
        try {
          const startTime = Date.now()
          
          const response = await fetch(testResult.url, {
            method: 'GET',
            timeout: CONFIG.REQUEST_TIMEOUT,
            headers: {
              'User-Agent': 'JudgeFinder-Accessibility-Bot/1.0',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
          })
          
          const endTime = Date.now()
          testResult.response_time = endTime - startTime
          testResult.status_code = response.status
          testResult.retries_used = attempt
          
          if (response.ok) {
            testResult.accessible = true
            
            // Additional accessibility checks
            const contentType = response.headers.get('content-type')
            if (!contentType || !contentType.includes('text/html')) {
              testResult.accessibility_issues.push('Non-HTML content type')
            }
            
            // Check for redirect loops (status 3xx)
            if (response.status >= 300 && response.status < 400) {
              testResult.accessibility_issues.push('Redirect detected')
            }
            
            return testResult
          } else {
            lastError = `HTTP ${response.status}: ${response.statusText}`
            
            // Don't retry for client errors (4xx)
            if (response.status >= 400 && response.status < 500) {
              break
            }
          }
          
        } catch (fetchError) {
          lastError = fetchError.message
          
          // Don't retry for timeout or connection errors on last attempt
          if (attempt === CONFIG.RETRY_ATTEMPTS - 1) {
            break
          }
          
          await this.delay(CONFIG.RETRY_DELAY * (attempt + 1))
        }
      }
      
      testResult.error = lastError
      testResult.retries_used = CONFIG.RETRY_ATTEMPTS
      
    } catch (error) {
      testResult.error = error.message
    }
    
    return testResult
  }

  async generateAccessibilityReport() {
    console.log('\n📊 Generating accessibility report...')
    
    // Calculate success rate
    const successRate = ((this.results.summary.accessible_urls / this.results.summary.total_urls_tested) * 100).toFixed(2)
    
    // Categorize issues
    const issueCategories = {
      'HTTP_4XX': [],
      'HTTP_5XX': [],
      'TIMEOUT': [],
      'CONNECTION_ERROR': [],
      'INVALID_SLUG': [],
      'OTHER': []
    }
    
    this.results.accessibility_issues.forEach(issue => {
      if (issue.status_code >= 400 && issue.status_code < 500) {
        issueCategories.HTTP_4XX.push(issue)
      } else if (issue.status_code >= 500) {
        issueCategories.HTTP_5XX.push(issue)
      } else if (issue.error && issue.error.includes('timeout')) {
        issueCategories.TIMEOUT.push(issue)
      } else if (issue.error && issue.error.includes('ECONNREFUSED')) {
        issueCategories.CONNECTION_ERROR.push(issue)
      } else if (issue.error && issue.error.includes('Invalid slug')) {
        issueCategories.INVALID_SLUG.push(issue)
      } else {
        issueCategories.OTHER.push(issue)
      }
    })
    
    // Create comprehensive report
    const report = {
      summary: {
        ...this.results.summary,
        success_rate: `${successRate}%`,
        test_completed_at: new Date().toISOString()
      },
      performance_metrics: {
        average_response_time: this.results.summary.average_response_time,
        fastest_response: this.results.summary.fastest_response,
        slowest_response: this.results.summary.slowest_response,
        response_time_distribution: this.calculateResponseTimeDistribution()
      },
      issue_breakdown: {
        client_errors_4xx: issueCategories.HTTP_4XX.length,
        server_errors_5xx: issueCategories.HTTP_5XX.length,
        timeout_errors: issueCategories.TIMEOUT.length,
        connection_errors: issueCategories.CONNECTION_ERROR.length,
        invalid_slug_errors: issueCategories.INVALID_SLUG.length,
        other_errors: issueCategories.OTHER.length
      },
      recommendations: this.generateAccessibilityRecommendations(issueCategories),
      test_configuration: {
        base_url: CONFIG.BASE_URL,
        concurrent_requests: CONFIG.CONCURRENT_REQUESTS,
        request_timeout: CONFIG.REQUEST_TIMEOUT,
        retry_attempts: CONFIG.RETRY_ATTEMPTS
      }
    }
    
    // Save detailed report
    const reportPath = path.join(process.cwd(), 'validation-reports', `url-accessibility-${Date.now()}.json`)
    await fs.mkdir(path.dirname(reportPath), { recursive: true })
    await fs.writeFile(reportPath, JSON.stringify({
      report,
      detailed_results: this.results.detailed_results,
      accessibility_issues: this.results.accessibility_issues,
      slug_issues: this.results.slug_generation_issues,
      issue_categories: issueCategories
    }, null, 2))
    
    console.log(`✅ Report saved: ${reportPath}`)
    
    // Print summary
    this.printAccessibilitySummary(report)
    
    return report
  }

  calculateResponseTimeDistribution() {
    const times = this.results.detailed_results
      .filter(r => r.accessible && r.response_time)
      .map(r => r.response_time)
      .sort((a, b) => a - b)
    
    if (times.length === 0) return {}
    
    return {
      median: times[Math.floor(times.length / 2)],
      p95: times[Math.floor(times.length * 0.95)],
      p99: times[Math.floor(times.length * 0.99)]
    }
  }

  generateAccessibilityRecommendations(issueCategories) {
    const recommendations = []
    
    if (issueCategories.HTTP_4XX.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'CLIENT_ERRORS',
        message: `${issueCategories.HTTP_4XX.length} judges have 4xx client errors`,
        action: 'Check slug generation and URL routing configuration'
      })
    }
    
    if (issueCategories.HTTP_5XX.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'SERVER_ERRORS',
        message: `${issueCategories.HTTP_5XX.length} judges have 5xx server errors`,
        action: 'Investigate server-side issues and application errors'
      })
    }
    
    if (issueCategories.TIMEOUT.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'PERFORMANCE',
        message: `${issueCategories.TIMEOUT.length} judges have timeout issues`,
        action: 'Optimize page load times and database queries'
      })
    }
    
    if (issueCategories.INVALID_SLUG.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'SLUG_GENERATION',
        message: `${issueCategories.INVALID_SLUG.length} judges have invalid slug formats`,
        action: 'Fix slug generation algorithm for special characters and edge cases'
      })
    }
    
    return recommendations
  }

  printAccessibilitySummary(report) {
    console.log('\n' + '='.repeat(70))
    console.log('🌐 URL ACCESSIBILITY TEST SUMMARY')
    console.log('='.repeat(70))
    console.log(`📊 Total URLs Tested: ${report.summary.total_urls_tested}`)
    console.log(`✅ Accessible: ${report.summary.accessible_urls} (${report.summary.success_rate})`)
    console.log(`❌ Inaccessible: ${report.summary.inaccessible_urls}`)
    console.log(`⚡ Average Response Time: ${report.performance_metrics.average_response_time}ms`)
    console.log(`🚀 Fastest Response: ${report.performance_metrics.fastest_response}ms`)
    console.log(`🐌 Slowest Response: ${report.performance_metrics.slowest_response}ms`)
    
    console.log('\n📋 Issue Breakdown:')
    Object.entries(report.issue_breakdown).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`   ${type}: ${count}`)
      }
    })
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      report.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. [${rec.priority}] ${rec.message}`)
      })
    }
    
    console.log('='.repeat(70))
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
      .replace(/^-|-$/g, '')
  }

  isValidSlug(slug) {
    return /^[a-z0-9-]+$/.test(slug) && !slug.startsWith('-') && !slug.endsWith('-')
  }
}

// Main execution
async function main() {
  const tester = new URLAccessibilityTester()
  await tester.runAccessibilityTest()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { URLAccessibilityTester }