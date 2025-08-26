#!/usr/bin/env node

/**
 * Quick validation runner script
 * 
 * A simple interface to run the comprehensive court-judge validation
 * with progress indicators and immediate feedback.
 * 
 * Usage:
 *   node scripts/run-validation.js
 *   node scripts/run-validation.js --quick    # Run subset of tests
 *   node scripts/run-validation.js --help     # Show help
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { CourtJudgeValidator } = require('./validate-court-judge-relationships')
const path = require('path')
const fs = require('fs').promises

// Parse command line arguments
const args = process.argv.slice(2)
const isQuickMode = args.includes('--quick')
const showHelp = args.includes('--help') || args.includes('-h')

function showUsage() {
  console.log(`
📋 Court-Judge Relationship Validation Tool

Usage:
  node scripts/run-validation.js [options]

Options:
  --quick     Run a subset of critical tests only (faster execution)
  --help, -h  Show this help message

Examples:
  node scripts/run-validation.js           # Full validation
  node scripts/run-validation.js --quick   # Quick validation

Environment Variables:
  NEXT_PUBLIC_SUPABASE_URL      - Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY     - Supabase service role key
  NEXT_PUBLIC_API_URL           - API base URL (default: http://localhost:3005)

Output:
  The script generates a detailed JSON report: court-judge-validation-report.json
  `)
}

class QuickValidator extends CourtJudgeValidator {
  async runQuickValidation() {
    this.reporter.log('Running Quick Validation (Critical Tests Only)', 'info')
    const overallStartTime = Date.now()

    try {
      await this.initialize()

      // Run critical tests only
      this.reporter.log('🔍 Testing California judges accessibility...', 'info')
      await this.validateCaliforniaJudgesAccessibility()

      this.reporter.log('🔍 Testing core API endpoints...', 'info')
      await this.validateCoreApiEndpoints()

      this.reporter.log('🔍 Testing basic court-judge relationships...', 'info')
      await this.validateSampleCourtJudges()

      // Generate recommendations
      this.generateRecommendations()

      const overallDuration = Date.now() - overallStartTime
      this.reporter.addPerformanceMetric('quick_validation_time', overallDuration)

      this.reporter.log(`Quick validation completed in ${overallDuration}ms`, 'success')

    } catch (error) {
      this.reporter.log(`Quick validation failed: ${error.message}`, 'error')
      this.reporter.addDetailedError('system', error)
    } finally {
      await this.reporter.generateReport()
      this.reporter.printSummary()
    }
  }

  async validateCoreApiEndpoints() {
    const coreEndpoints = [
      {
        name: 'Judges List',
        url: '/api/judges/list?limit=10',
        requiredFields: ['judges', 'total_count']
      },
      {
        name: 'Courts List',
        url: '/api/courts?limit=10',
        requiredFields: ['courts', 'total_count']
      }
    ]

    for (const endpoint of coreEndpoints) {
      try {
        const { data, duration } = await this.makeApiRequest(endpoint.url)
        
        const missingFields = endpoint.requiredFields.filter(field => !(field in data))
        
        if (missingFields.length > 0) {
          this.reporter.addTest(
            'api_endpoint_testing',
            `${endpoint.name} - Core Structure`,
            'failed',
            {
              missing_fields: missingFields,
              severity: 'critical'
            }
          )
        } else {
          this.reporter.addTest(
            'api_endpoint_testing',
            `${endpoint.name} - Core Structure`,
            'passed',
            {
              response_time_ms: duration
            }
          )
        }
      } catch (error) {
        this.reporter.addTest(
          'api_endpoint_testing',
          `${endpoint.name} - Request Failed`,
          'failed',
          {
            error: error.message,
            severity: 'critical'
          }
        )
      }
    }
  }

  async validateSampleCourtJudges() {
    try {
      // Get just one court to test basic functionality
      const { data: courtsData } = await this.makeApiRequest('/api/courts?limit=1')
      
      if (!courtsData.courts || courtsData.courts.length === 0) {
        this.reporter.addTest(
          'court_judge_relationships',
          'Sample Court Judges - No Courts Available',
          'failed',
          {
            error: 'No courts found in database',
            severity: 'critical'
          }
        )
        return
      }

      const court = courtsData.courts[0]
      await this.validateSingleCourtJudges(court)

    } catch (error) {
      this.reporter.addTest(
        'court_judge_relationships',
        'Sample Court Judges Validation Failed',
        'failed',
        {
          error: error.message,
          severity: 'high'
        }
      )
    }
  }
}

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...')

  // Check if we're in the right directory
  try {
    await fs.access('package.json')
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'))
    
    if (!packageJson.name || !packageJson.name.includes('judge-finder')) {
      console.log('⚠️  Warning: You might not be in the correct project directory')
    }
  } catch (error) {
    console.log('❌ Error: package.json not found. Please run this script from the project root directory.')
    return false
  }

  // Check environment variables
  const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missingEnvVars.length > 0) {
    console.log('❌ Missing required environment variables:')
    missingEnvVars.forEach(envVar => {
      console.log(`   - ${envVar}`)
    })
    console.log('\nPlease set these in your .env.local file or environment.')
    return false
  }

  // Check if server might be running
  const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'
  try {
    const response = await fetch(`${serverUrl}/api/courts?limit=1`, {
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) {
      console.log(`⚠️  Warning: API server returned status ${response.status}`)
      console.log('   Make sure your development server is running: npx next dev -p 3005')
      return false
    }
  } catch (error) {
    console.log('⚠️  Warning: Unable to connect to API server')
    console.log('   Make sure your development server is running: npx next dev -p 3005')
    console.log(`   Expected URL: ${serverUrl}`)
    return false
  }

  console.log('✅ Prerequisites check passed')
  return true
}

async function main() {
  console.log('🏛️  Judge Finder Platform - Court-Judge Relationship Validator\n')

  if (showHelp) {
    showUsage()
    return
  }

  // Check prerequisites
  const prereqsPassed = await checkPrerequisites()
  if (!prereqsPassed) {
    console.log('\n❌ Prerequisites check failed. Please fix the issues above and try again.')
    process.exit(1)
  }

  console.log() // Empty line for readability

  // Run validation
  if (isQuickMode) {
    console.log('🚀 Running Quick Validation...\n')
    const validator = new QuickValidator()
    await validator.runQuickValidation()
  } else {
    console.log('🚀 Running Full Validation...\n')
    const validator = new CourtJudgeValidator()
    await validator.runFullValidation()
  }

  // Show report file location
  const reportPath = path.resolve('court-judge-validation-report.json')
  console.log(`\n📄 Detailed report saved to: ${reportPath}`)
  
  // Quick summary of critical issues
  try {
    const reportData = JSON.parse(await fs.readFile('court-judge-validation-report.json', 'utf8'))
    
    if (reportData.summary.critical_errors > 0) {
      console.log(`\n🚨 CRITICAL: ${reportData.summary.critical_errors} critical errors found!`)
      console.log('   Review the detailed report for immediate action items.')
    } else if (reportData.summary.failed_tests > 0) {
      console.log(`\n⚠️  WARNING: ${reportData.summary.failed_tests} tests failed.`)
      console.log('   System may have issues that need attention.')
    } else {
      console.log('\n🎉 SUCCESS: All tests passed! System is ready for production.')
    }
  } catch (error) {
    console.log('\n📄 Report generated successfully.')
  }
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error during validation:', error.message)
  process.exit(1)
})