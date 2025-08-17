/**
 * Migration Completion Guide
 * 
 * Provides step-by-step guidance to complete the database migration
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

class MigrationCompletionGuide {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }

  async checkCurrentState() {
    console.log('🔍 Checking current migration state...')
    
    const state = {
      courthouse_metadata: false,
      positions: false,
      judge_court_positions: false,
      californiaJudges: 0,
      totalJudges: 0,
      totalCourts: 0
    }

    try {
      // Check courthouse_metadata column
      await this.supabase.from('courts').select('courthouse_metadata').limit(1)
      state.courthouse_metadata = true
      console.log('   ✅ courts.courthouse_metadata column exists')
    } catch (error) {
      console.log('   ❌ courts.courthouse_metadata column missing')
    }

    try {
      // Check positions column  
      await this.supabase.from('judges').select('positions').limit(1)
      state.positions = true
      console.log('   ✅ judges.positions column exists')
    } catch (error) {
      console.log('   ❌ judges.positions column missing')
    }

    try {
      // Check judge_court_positions table
      await this.supabase.from('judge_court_positions').select('id').limit(1)
      state.judge_court_positions = true
      console.log('   ✅ judge_court_positions table exists')
    } catch (error) {
      console.log('   ❌ judge_court_positions table missing')
    }

    // Count judges and courts
    try {
      const { count: totalJudges } = await this.supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })

      const { count: caJudges } = await this.supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })
        .eq('jurisdiction', 'CA')

      const { count: totalCourts } = await this.supabase
        .from('courts')
        .select('*', { count: 'exact', head: true })

      state.totalJudges = totalJudges
      state.californiaJudges = caJudges
      state.totalCourts = totalCourts

      console.log(`   📊 Data counts: ${totalJudges} total judges, ${caJudges} CA judges, ${totalCourts} courts`)
    } catch (error) {
      console.log('   ⚠️  Could not retrieve data counts:', error.message)
    }

    return state
  }

  async generateSQLScript() {
    console.log('\n📝 Generating complete SQL migration script...')
    
    const migrationFiles = [
      'supabase/migrations/20250817_001_add_courtlistener_fields.sql',
      'supabase/migrations/20250817_002_create_judge_court_positions.sql',
      'supabase/migrations/20250817_003_add_performance_indexes.sql'
    ]

    let combinedSQL = `-- Complete Database Migration Script
-- Generated: ${new Date().toISOString()}
-- Execute this entire script in Supabase SQL Editor

`

    for (const migrationFile of migrationFiles) {
      const fullPath = path.join(process.cwd(), migrationFile)
      
      if (fs.existsSync(fullPath)) {
        const sql = fs.readFileSync(fullPath, 'utf8')
        combinedSQL += `\n-- Migration: ${path.basename(migrationFile)}\n`
        combinedSQL += `-- File: ${migrationFile}\n`
        combinedSQL += sql
        combinedSQL += '\n\n'
      }
    }

    // Save the combined script
    const outputPath = path.join(process.cwd(), 'scripts', 'complete-migration.sql')
    fs.writeFileSync(outputPath, combinedSQL)
    
    console.log(`   ✅ Combined SQL script saved to: ${outputPath}`)
    return outputPath
  }

  async showNextSteps(state) {
    console.log('\n📋 Next Steps for Migration Completion')
    console.log('=' .repeat(60))

    if (!state.courthouse_metadata || !state.positions) {
      console.log('❌ STEP 1: Missing required columns')
      console.log('   Execute in Supabase SQL Editor:')
      console.log('')
      if (!state.courthouse_metadata) {
        console.log("   ALTER TABLE courts ADD COLUMN IF NOT EXISTS courthouse_metadata JSONB DEFAULT '{}'::jsonb;")
      }
      if (!state.positions) {
        console.log("   ALTER TABLE judges ADD COLUMN IF NOT EXISTS positions JSONB DEFAULT '[]'::jsonb;")
      }
      console.log('')
    } else {
      console.log('✅ STEP 1: Required columns exist')
    }

    if (!state.judge_court_positions) {
      console.log('❌ STEP 2: Create judge_court_positions table')
      console.log('   Execute the complete migration script or manually create the table')
      console.log('')
    } else {
      console.log('✅ STEP 2: judge_court_positions table exists')
    }

    if (state.courthouse_metadata && state.positions && state.judge_court_positions) {
      console.log('✅ STEP 3: Ready for data migration')
      console.log('   Run: node scripts/complete-migration-process.js')
      console.log('')
      console.log('✅ STEP 4: Verify California judges accessibility')
      console.log('   Expected: All 1,810+ California judges should remain accessible')
      console.log('')
    } else {
      console.log('⏳ STEP 3: Complete schema setup first')
      console.log('')
    }

    console.log('🔗 Supabase SQL Editor:')
    console.log('   https://supabase.com/dashboard/project/xstlnicbnzdxlgfiewmg/sql')
    console.log('')
    console.log('=' .repeat(60))
  }

  async testDataAccess() {
    console.log('\n🧪 Testing data access...')
    
    try {
      // Test California judges access
      const { data: caJudges, error } = await this.supabase
        .from('judges')
        .select('id, name, court_name, jurisdiction')
        .eq('jurisdiction', 'CA')
        .limit(5)

      if (error) {
        console.log('   ❌ Error accessing California judges:', error.message)
      } else {
        console.log(`   ✅ Can access California judges: ${caJudges.length} sample records`)
        if (caJudges.length > 0) {
          console.log(`   📋 Sample: ${caJudges[0].name} - ${caJudges[0].court_name}`)
        }
      }

      // Test API endpoint
      const response = await fetch('http://localhost:3005/api/judges/list?jurisdiction=CA&limit=5')
      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ API endpoint accessible: ${data.judges?.length || 0} judges returned`)
      } else {
        console.log('   ⚠️  API endpoint test failed')
      }

    } catch (error) {
      console.log('   ⚠️  Data access test failed:', error.message)
    }
  }

  async run() {
    try {
      console.log('🚀 Migration Completion Guide')
      console.log('=' .repeat(60))

      // Check current state
      const state = await this.checkCurrentState()

      // Generate SQL script
      const sqlPath = await this.generateSQLScript()

      // Show next steps
      await this.showNextSteps(state)

      // Test data access
      await this.testDataAccess()

      console.log('\n📄 Files created:')
      console.log(`   - ${sqlPath}`)
      console.log('')

      return state
    } catch (error) {
      console.error('💥 Error:', error.message)
      return null
    }
  }
}

// Main execution
async function main() {
  try {
    const guide = new MigrationCompletionGuide()
    const state = await guide.run()
    
    if (state) {
      const ready = state.courthouse_metadata && state.positions && state.judge_court_positions
      
      if (ready) {
        console.log('🎉 Schema is ready for data migration!')
        process.exit(0)
      } else {
        console.log('📝 Manual steps required to complete schema setup.')
        process.exit(1)
      }
    } else {
      console.log('❌ Migration check failed!')
      process.exit(1)
    }
  } catch (error) {
    console.error('💥 Unhandled error:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { MigrationCompletionGuide }