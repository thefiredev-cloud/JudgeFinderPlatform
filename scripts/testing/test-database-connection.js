#!/usr/bin/env node

/**
 * Database Connection Test Script
 * 
 * Tests database connectivity, validates schema, and diagnoses connection issues
 * 
 * Usage: node scripts/test-database-connection.js
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

class DatabaseTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: {
        url: SUPABASE_URL ? '✓ Set' : '✗ Missing',
        serviceKey: SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing',
        anonKey: SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'
      },
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    }

    // Initialize clients
    this.serviceClient = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? 
      createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null
    
    this.anonClient = SUPABASE_URL && SUPABASE_ANON_KEY ? 
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null
  }

  log(message, level = 'info') {
    const icons = { info: '📋', success: '✅', warning: '⚠️', error: '❌' }
    console.log(`${icons[level]} ${message}`)
  }

  addTest(name, status, details = {}) {
    const test = {
      name,
      status,
      timestamp: new Date().toISOString(),
      ...details
    }
    
    this.results.tests.push(test)
    this.results.summary.total++
    
    if (status === 'passed') {
      this.results.summary.passed++
      this.log(`${name} - PASSED`, 'success')
    } else {
      this.results.summary.failed++
      this.log(`${name} - FAILED: ${details.error || 'Unknown error'}`, 'error')
    }
  }

  async testEnvironmentVariables() {
    this.log('Testing Environment Variables...', 'info')
    
    const missingVars = []
    if (!SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY')
    if (!SUPABASE_ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    if (missingVars.length === 0) {
      this.addTest('Environment Variables', 'passed')
    } else {
      this.addTest('Environment Variables', 'failed', {
        error: `Missing variables: ${missingVars.join(', ')}`
      })
    }
  }

  async testBasicConnection() {
    this.log('Testing Basic Database Connection...', 'info')
    
    if (!this.serviceClient) {
      this.addTest('Basic Connection', 'failed', {
        error: 'Cannot create service client - missing environment variables'
      })
      return
    }

    try {
      const startTime = Date.now()
      const { data, error } = await this.serviceClient
        .from('judges')
        .select('id')
        .limit(1)
      
      const latency = Date.now() - startTime

      if (error) {
        this.addTest('Basic Connection', 'failed', {
          error: error.message,
          latency: `${latency}ms`
        })
      } else {
        this.addTest('Basic Connection', 'passed', {
          latency: `${latency}ms`,
          recordsFound: data?.length || 0
        })
      }
    } catch (error) {
      this.addTest('Basic Connection', 'failed', {
        error: error.message
      })
    }
  }

  async testTableExistence() {
    this.log('Testing Table Existence...', 'info')
    
    const requiredTables = ['judges', 'courts', 'cases', 'decisions']
    
    for (const table of requiredTables) {
      try {
        const { count, error } = await this.serviceClient
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          this.addTest(`Table: ${table}`, 'failed', {
            error: error.message
          })
        } else {
          this.addTest(`Table: ${table}`, 'passed', {
            recordCount: count
          })
        }
      } catch (error) {
        this.addTest(`Table: ${table}`, 'failed', {
          error: error.message
        })
      }
    }
  }

  async testAnonymousAccess() {
    this.log('Testing Anonymous Access...', 'info')
    
    if (!this.anonClient) {
      this.addTest('Anonymous Access', 'failed', {
        error: 'Cannot create anonymous client'
      })
      return
    }

    try {
      const { data, error } = await this.anonClient
        .from('judges')
        .select('id, name')
        .limit(5)

      if (error) {
        this.addTest('Anonymous Access', 'failed', {
          error: error.message
        })
      } else {
        this.addTest('Anonymous Access', 'passed', {
          recordsAccessed: data?.length || 0
        })
      }
    } catch (error) {
      this.addTest('Anonymous Access', 'failed', {
        error: error.message
      })
    }
  }

  async testRPCFunctions() {
    this.log('Testing RPC Functions...', 'info')
    
    const rpcFunctions = ['find_orphaned_judges']
    
    for (const funcName of rpcFunctions) {
      try {
        const { data, error } = await this.serviceClient.rpc(funcName)
        
        if (error) {
          this.addTest(`RPC: ${funcName}`, 'failed', {
            error: error.message
          })
        } else {
          this.addTest(`RPC: ${funcName}`, 'passed', {
            resultCount: Array.isArray(data) ? data.length : 'single result'
          })
        }
      } catch (error) {
        this.addTest(`RPC: ${funcName}`, 'failed', {
          error: error.message
        })
      }
    }
  }

  async testPerformance() {
    this.log('Testing Database Performance...', 'info')
    
    const tests = [
      {
        name: 'Simple Query Performance',
        query: () => this.serviceClient
          .from('judges')
          .select('id, name')
          .limit(100)
      },
      {
        name: 'Complex Query Performance',
        query: () => this.serviceClient
          .from('judges')
          .select('id, name, court_id, courts(name)')
          .limit(50)
      },
      {
        name: 'Count Query Performance',
        query: () => this.serviceClient
          .from('judges')
          .select('*', { count: 'exact', head: true })
      }
    ]

    for (const test of tests) {
      try {
        const startTime = Date.now()
        const { data, error } = await test.query()
        const latency = Date.now() - startTime

        if (error) {
          this.addTest(test.name, 'failed', {
            error: error.message,
            latency: `${latency}ms`
          })
        } else {
          const status = latency < 2000 ? 'passed' : 'failed'
          this.addTest(test.name, status, {
            latency: `${latency}ms`,
            threshold: '2000ms',
            recordsReturned: Array.isArray(data) ? data.length : 'count query'
          })
        }
      } catch (error) {
        this.addTest(test.name, 'failed', {
          error: error.message
        })
      }
    }
  }

  async run() {
    this.log('🚀 Starting Database Connection Tests', 'info')
    console.log('=' .repeat(50))

    await this.testEnvironmentVariables()
    await this.testBasicConnection()
    
    if (this.serviceClient) {
      await this.testTableExistence()
      await this.testAnonymousAccess()
      await this.testRPCFunctions()
      await this.testPerformance()
    }

    console.log('=' .repeat(50))
    this.log(`Tests completed: ${this.results.summary.passed}/${this.results.summary.total} passed`, 'info')
    
    if (this.results.summary.failed > 0) {
      this.log(`Failed tests: ${this.results.summary.failed}`, 'warning')
      process.exit(1)
    } else {
      this.log('All tests passed! Database is healthy.', 'success')
    }

    // Save detailed results
    const fs = require('fs').promises
    await fs.writeFile(
      'database-connection-test-results.json',
      JSON.stringify(this.results, null, 2)
    )
    this.log('Detailed results saved to database-connection-test-results.json', 'info')
  }
}

// Run the tests
if (require.main === module) {
  const tester = new DatabaseTester()
  tester.run().catch(error => {
    console.error('❌ Test runner failed:', error)
    process.exit(1)
  })
}

module.exports = DatabaseTester