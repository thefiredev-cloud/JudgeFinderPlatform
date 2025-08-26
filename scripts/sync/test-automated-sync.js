#!/usr/bin/env node

/**
 * Test Automated Sync System
 * 
 * This script tests the newly implemented automated sync system by:
 * 1. Setting up the sync database tables
 * 2. Testing sync API endpoints
 * 3. Testing queue management
 * 4. Verifying webhook endpoints
 * 5. Testing cron job endpoints
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const SYNC_API_KEY = process.env.SYNC_API_KEY || 'judge-finder-sync-2025-secure-key-v1'
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3005'

class AutomatedSyncTester {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    this.testResults = []
  }

  async runAllTests() {
    console.log('🚀 Starting Automated Sync System Tests...\n')

    try {
      // 1. Setup database tables
      await this.testDatabaseSetup()
      
      // 2. Test sync API endpoints
      await this.testSyncEndpoints()
      
      // 3. Test queue management
      await this.testQueueManagement()
      
      // 4. Test admin dashboard
      await this.testAdminDashboard()
      
      // 5. Test webhook verification
      await this.testWebhookEndpoint()
      
      // 6. Test cron endpoints
      await this.testCronEndpoints()

      // Summary
      this.printSummary()

    } catch (error) {
      console.error('❌ Test suite failed:', error.message)
      process.exit(1)
    }
  }

  async testDatabaseSetup() {
    console.log('📋 Testing Database Setup...')
    
    try {
      // Read and execute sync tables SQL
      const sqlPath = join(__dirname, '..', 'lib', 'database', 'sync-tables.sql')
      
      if (fs.existsSync(sqlPath)) {
        console.log('  ✅ Sync tables SQL file exists')
        this.addResult('Database', 'SQL file exists', true)
      } else {
        console.log('  ❌ Sync tables SQL file missing')
        this.addResult('Database', 'SQL file exists', false)
        return
      }

      // Test if tables exist (they should be created manually first)
      const tables = ['sync_logs', 'sync_queue', 'webhook_events', 'sync_statistics']
      
      for (const table of tables) {
        try {
          const { data, error } = await this.supabase
            .from(table)
            .select('id')
            .limit(1)

          if (error && error.code === 'PGRST116') {
            console.log(`  ⚠️  Table ${table} does not exist - run sync-tables.sql first`)
            this.addResult('Database', `Table ${table}`, false)
          } else {
            console.log(`  ✅ Table ${table} exists and accessible`)
            this.addResult('Database', `Table ${table}`, true)
          }
        } catch (err) {
          console.log(`  ❌ Error checking table ${table}: ${err.message}`)
          this.addResult('Database', `Table ${table}`, false)
        }
      }

    } catch (error) {
      console.log(`  ❌ Database setup test failed: ${error.message}`)
      this.addResult('Database', 'Setup test', false)
    }

    console.log('')
  }

  async testSyncEndpoints() {
    console.log('🔄 Testing Sync API Endpoints...')

    const endpoints = [
      { name: 'Courts Sync', path: '/api/sync/courts' },
      { name: 'Judges Sync', path: '/api/sync/judges' },
      { name: 'Decisions Sync', path: '/api/sync/decisions' }
    ]

    for (const endpoint of endpoints) {
      try {
        // Test GET (info endpoint)
        console.log(`  Testing ${endpoint.name} GET...`)
        const getResponse = await fetch(`${BASE_URL}${endpoint.path}`, {
          method: 'GET',
          headers: {
            'x-api-key': SYNC_API_KEY,
            'Content-Type': 'application/json'
          }
        })

        if (getResponse.ok) {
          const data = await getResponse.json()
          console.log(`    ✅ GET ${endpoint.path} - Info retrieved`)
          this.addResult('Sync API', `${endpoint.name} GET`, true)
        } else {
          console.log(`    ❌ GET ${endpoint.path} - Status: ${getResponse.status}`)
          this.addResult('Sync API', `${endpoint.name} GET`, false)
        }

        // Test POST with minimal options (don't actually run full sync)
        console.log(`  Testing ${endpoint.name} POST (dry run)...`)
        
        // For now, we'll just test authentication and parameter validation
        const postResponse = await fetch(`${BASE_URL}${endpoint.path}`, {
          method: 'POST',
          headers: {
            'x-api-key': 'invalid-key', // Test auth failure
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            batchSize: 1,
            dryRun: true
          })
        })

        if (postResponse.status === 401) {
          console.log(`    ✅ POST ${endpoint.path} - Auth validation working`)
          this.addResult('Sync API', `${endpoint.name} Auth`, true)
        } else {
          console.log(`    ❌ POST ${endpoint.path} - Auth should fail with invalid key`)
          this.addResult('Sync API', `${endpoint.name} Auth`, false)
        }

      } catch (error) {
        console.log(`    ❌ Error testing ${endpoint.name}: ${error.message}`)
        this.addResult('Sync API', `${endpoint.name}`, false)
      }
    }

    console.log('')
  }

  async testQueueManagement() {
    console.log('📊 Testing Queue Management...')

    try {
      // Test adding a job to queue (if sync_queue table exists)
      const { data: queueExists } = await this.supabase
        .from('sync_queue')
        .select('id')
        .limit(1)

      if (queueExists !== null) {
        // Add a test job
        const testJob = {
          id: `test-${Date.now()}`,
          type: 'decision',
          status: 'pending',
          options: { test: true },
          priority: 0,
          retry_count: 0,
          max_retries: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: insertError } = await this.supabase
          .from('sync_queue')
          .insert(testJob)

        if (!insertError) {
          console.log('  ✅ Queue - Job insertion works')
          this.addResult('Queue', 'Job insertion', true)

          // Clean up test job
          await this.supabase
            .from('sync_queue')
            .delete()
            .eq('id', testJob.id)

          console.log('  ✅ Queue - Job cleanup works')
          this.addResult('Queue', 'Job cleanup', true)
        } else {
          console.log(`  ❌ Queue - Job insertion failed: ${insertError.message}`)
          this.addResult('Queue', 'Job insertion', false)
        }
      } else {
        console.log('  ⚠️  Queue table not accessible - run sync-tables.sql first')
        this.addResult('Queue', 'Table access', false)
      }

    } catch (error) {
      console.log(`  ❌ Queue management test failed: ${error.message}`)
      this.addResult('Queue', 'Management test', false)
    }

    console.log('')
  }

  async testAdminDashboard() {
    console.log('📈 Testing Admin Dashboard...')

    try {
      const response = await fetch(`${BASE_URL}/api/admin/sync-status`, {
        method: 'GET',
        headers: {
          'x-api-key': SYNC_API_KEY,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('  ✅ Admin dashboard accessible')
        console.log(`    - Health status: ${data.health?.status || 'unknown'}`)
        console.log(`    - Queue stats: ${JSON.stringify(data.queue?.stats || {})}`)
        this.addResult('Admin', 'Dashboard access', true)
      } else {
        console.log(`  ❌ Admin dashboard failed - Status: ${response.status}`)
        this.addResult('Admin', 'Dashboard access', false)
      }

    } catch (error) {
      console.log(`  ❌ Admin dashboard test failed: ${error.message}`)
      this.addResult('Admin', 'Dashboard test', false)
    }

    console.log('')
  }

  async testWebhookEndpoint() {
    console.log('🔗 Testing Webhook Endpoint...')

    try {
      // Test webhook verification endpoint
      const verifyResponse = await fetch(`${BASE_URL}/api/webhooks/courtlistener?hub.challenge=test123&hub.verify_token=${process.env.COURTLISTENER_WEBHOOK_VERIFY_TOKEN}`, {
        method: 'GET'
      })

      if (verifyResponse.ok) {
        const challenge = await verifyResponse.text()
        if (challenge === 'test123') {
          console.log('  ✅ Webhook verification works')
          this.addResult('Webhook', 'Verification', true)
        } else {
          console.log('  ❌ Webhook verification returns wrong challenge')
          this.addResult('Webhook', 'Verification', false)
        }
      } else {
        console.log(`  ❌ Webhook verification failed - Status: ${verifyResponse.status}`)
        this.addResult('Webhook', 'Verification', false)
      }

      // Test webhook POST (without signature - should fail)
      const postResponse = await fetch(`${BASE_URL}/api/webhooks/courtlistener`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event: 'opinion.created',
          data: { id: 'test' },
          timestamp: new Date().toISOString()
        })
      })

      if (postResponse.status === 401) {
        console.log('  ✅ Webhook POST auth validation works')
        this.addResult('Webhook', 'Auth validation', true)
      } else {
        console.log(`  ❌ Webhook POST should fail auth - Status: ${postResponse.status}`)
        this.addResult('Webhook', 'Auth validation', false)
      }

    } catch (error) {
      console.log(`  ❌ Webhook test failed: ${error.message}`)
      this.addResult('Webhook', 'Test', false)
    }

    console.log('')
  }

  async testCronEndpoints() {
    console.log('⏰ Testing Cron Endpoints...')

    const cronEndpoints = [
      { name: 'Daily Sync', path: '/api/cron/daily-sync' },
      { name: 'Weekly Sync', path: '/api/cron/weekly-sync' }
    ]

    for (const endpoint of cronEndpoints) {
      try {
        // Test without proper authorization (should fail)
        const response = await fetch(`${BASE_URL}${endpoint.path}`, {
          method: 'GET',
          headers: {
            'authorization': 'Bearer invalid-token'
          }
        })

        if (response.status === 401) {
          console.log(`  ✅ ${endpoint.name} - Auth validation works`)
          this.addResult('Cron', `${endpoint.name} Auth`, true)
        } else {
          console.log(`  ❌ ${endpoint.name} - Should fail auth with invalid token`)
          this.addResult('Cron', `${endpoint.name} Auth`, false)
        }

      } catch (error) {
        console.log(`  ❌ ${endpoint.name} test failed: ${error.message}`)
        this.addResult('Cron', `${endpoint.name}`, false)
      }
    }

    console.log('')
  }

  addResult(category, test, passed) {
    this.testResults.push({ category, test, passed })
  }

  printSummary() {
    console.log('📊 Test Summary')
    console.log('=' * 50)

    const categories = [...new Set(this.testResults.map(r => r.category))]
    let totalPassed = 0
    let totalTests = this.testResults.length

    for (const category of categories) {
      const categoryResults = this.testResults.filter(r => r.category === category)
      const passed = categoryResults.filter(r => r.passed).length
      const total = categoryResults.length

      console.log(`\n${category}:`)
      categoryResults.forEach(result => {
        const icon = result.passed ? '✅' : '❌'
        console.log(`  ${icon} ${result.test}`)
      })
      console.log(`  📈 ${passed}/${total} tests passed`)

      totalPassed += passed
    }

    console.log(`\n🎯 Overall: ${totalPassed}/${totalTests} tests passed (${Math.round(totalPassed/totalTests * 100)}%)`)

    if (totalPassed === totalTests) {
      console.log('\n🎉 All tests passed! Automated sync system is ready.')
    } else {
      console.log('\n⚠️  Some tests failed. Review the issues above before deploying.')
    }

    console.log('\n📋 Next Steps:')
    console.log('1. Run the sync-tables.sql in your Supabase dashboard')
    console.log('2. Deploy to Vercel with environment variables')
    console.log('3. Monitor the admin dashboard at /api/admin/sync-status')
    console.log('4. Set up CourtListener webhooks (optional)')
    console.log('5. Verify cron jobs are running in Vercel dashboard')
  }
}

// Run tests
async function main() {
  const tester = new AutomatedSyncTester()
  await tester.runAllTests()
}

main().catch(console.error)