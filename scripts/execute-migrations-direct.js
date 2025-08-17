/**
 * Direct Database Migration Executor
 * 
 * Executes database migrations directly through Supabase REST API
 * instead of using the sql() function which is not available.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

class DirectMigrationExecutor {
  constructor() {
    this.validateEnvironment()
    
    // Initialize Supabase client with service role
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('🔧 Direct Migration Executor initialized')
  }

  validateEnvironment() {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]

    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }

  /**
   * Execute a single DDL statement using Supabase's direct query
   */
  async executeDDL(statement) {
    try {
      // Use the direct query approach with proper escaping
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: statement
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      return { success: true }
    } catch (error) {
      // Try alternative approach using pg_notify workaround
      try {
        // Create a temporary function to execute the DDL
        const tempFunctionName = `temp_ddl_${Date.now()}`
        const createFuncSQL = `
          CREATE OR REPLACE FUNCTION ${tempFunctionName}()
          RETURNS TEXT AS $$
          BEGIN
            EXECUTE '${statement.replace(/'/g, "''")}';
            RETURN 'SUCCESS';
          END;
          $$ LANGUAGE plpgsql;
        `
        
        // Execute function creation using RPC
        const { data: createResult, error: createError } = await this.supabase
          .rpc('exec_sql', { query: createFuncSQL })
        
        if (createError) {
          throw new Error(`Function creation failed: ${createError.message}`)
        }

        // Call the function
        const { data: execResult, error: execError } = await this.supabase
          .rpc(tempFunctionName)

        if (execError) {
          throw new Error(`Function execution failed: ${execError.message}`)
        }

        // Clean up the temporary function
        const dropFuncSQL = `DROP FUNCTION IF EXISTS ${tempFunctionName}()`
        await this.supabase.rpc('exec_sql', { query: dropFuncSQL })

        return { success: true }
      } catch (altError) {
        throw new Error(`Primary: ${error.message}, Alternative: ${altError.message}`)
      }
    }
  }

  /**
   * Execute migrations step by step
   */
  async executeMigrations() {
    try {
      console.log('🚀 Starting direct migration execution...')
      
      // Step 1: Add CourtListener fields to courts table
      console.log('\n📋 Step 1: Adding CourtListener fields to courts table...')
      
      const courtsStatements = [
        'ALTER TABLE courts ADD COLUMN IF NOT EXISTS courtlistener_id VARCHAR(50)',
        'ALTER TABLE courts ADD COLUMN IF NOT EXISTS courthouse_metadata JSONB DEFAULT \'{}\'::jsonb',
        'CREATE INDEX IF NOT EXISTS idx_courts_courtlistener_id ON courts(courtlistener_id) WHERE courtlistener_id IS NOT NULL',
        'ALTER TABLE courts ADD CONSTRAINT IF NOT EXISTS courts_courtlistener_id_unique UNIQUE(courtlistener_id)'
      ]

      for (const [index, statement] of courtsStatements.entries()) {
        console.log(`   ⚡ Executing courts statement ${index + 1}/${courtsStatements.length}...`)
        try {
          await this.executeDDL(statement)
          console.log(`   ✅ Statement ${index + 1} completed`)
        } catch (error) {
          console.log(`   ❌ Statement ${index + 1} failed:`, error.message)
          // Continue with next statement
        }
      }

      // Step 2: Add CourtListener fields to judges table
      console.log('\n📋 Step 2: Adding CourtListener fields to judges table...')
      
      const judgesStatements = [
        'ALTER TABLE judges ADD COLUMN IF NOT EXISTS courtlistener_id VARCHAR(50)',
        'ALTER TABLE judges ADD COLUMN IF NOT EXISTS positions JSONB DEFAULT \'[]\'::jsonb',
        'CREATE INDEX IF NOT EXISTS idx_judges_courtlistener_id ON judges(courtlistener_id) WHERE courtlistener_id IS NOT NULL',
        'CREATE INDEX IF NOT EXISTS idx_judges_jurisdiction ON judges(jurisdiction)',
        'ALTER TABLE judges ADD CONSTRAINT IF NOT EXISTS judges_courtlistener_id_unique UNIQUE(courtlistener_id)'
      ]

      for (const [index, statement] of judgesStatements.entries()) {
        console.log(`   ⚡ Executing judges statement ${index + 1}/${judgesStatements.length}...`)
        try {
          await this.executeDDL(statement)
          console.log(`   ✅ Statement ${index + 1} completed`)
        } catch (error) {
          console.log(`   ❌ Statement ${index + 1} failed:`, error.message)
          // Continue with next statement
        }
      }

      // Step 3: Create judge_court_positions table
      console.log('\n📋 Step 3: Creating judge_court_positions table...')
      
      const createTableStatement = `
        CREATE TABLE IF NOT EXISTS judge_court_positions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          judge_id UUID NOT NULL,
          court_id UUID NOT NULL,
          position_type VARCHAR(100) NOT NULL DEFAULT 'Judge',
          appointment_date DATE,
          start_date DATE,
          end_date DATE,
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          
          CONSTRAINT fk_judge_court_positions_judge_id 
            FOREIGN KEY (judge_id) REFERENCES judges(id) ON DELETE CASCADE,
          CONSTRAINT fk_judge_court_positions_court_id 
            FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE,
          CONSTRAINT unique_active_judge_court_position 
            UNIQUE(judge_id, court_id, status, position_type) 
            DEFERRABLE INITIALLY DEFERRED
        )
      `

      console.log('   ⚡ Creating judge_court_positions table...')
      try {
        await this.executeDDL(createTableStatement)
        console.log('   ✅ Table created successfully')
      } catch (error) {
        console.log(`   ❌ Table creation failed:`, error.message)
      }

      // Step 4: Add indexes
      console.log('\n📋 Step 4: Adding indexes...')
      
      const indexStatements = [
        'CREATE INDEX IF NOT EXISTS idx_judge_court_positions_judge_id ON judge_court_positions(judge_id)',
        'CREATE INDEX IF NOT EXISTS idx_judge_court_positions_court_id ON judge_court_positions(court_id)',
        'CREATE INDEX IF NOT EXISTS idx_judge_court_positions_status ON judge_court_positions(status)',
        'CREATE INDEX IF NOT EXISTS idx_judge_court_positions_dates ON judge_court_positions(start_date, end_date)',
        'CREATE INDEX IF NOT EXISTS idx_judge_court_positions_type ON judge_court_positions(position_type)',
        'CREATE INDEX IF NOT EXISTS idx_judge_court_positions_lookup ON judge_court_positions(judge_id, court_id, status, start_date DESC)'
      ]

      for (const [index, statement] of indexStatements.entries()) {
        console.log(`   ⚡ Creating index ${index + 1}/${indexStatements.length}...`)
        try {
          await this.executeDDL(statement)
          console.log(`   ✅ Index ${index + 1} created`)
        } catch (error) {
          console.log(`   ❌ Index ${index + 1} failed:`, error.message)
        }
      }

      console.log('\n✅ Migration execution completed!')
      return await this.verifyMigrations()

    } catch (error) {
      console.error('💥 Fatal error during migrations:', error.message)
      return false
    }
  }

  /**
   * Verify migration results
   */
  async verifyMigrations() {
    console.log('\n🔍 Verifying migration results...')

    try {
      // Check if new columns exist in courts table
      const { data: courtsTest, error: courtsError } = await this.supabase
        .from('courts')
        .select('id, courtlistener_id, courthouse_metadata')
        .limit(1)

      if (courtsError) {
        console.log('❌ Courts table verification failed:', courtsError.message)
        return false
      } else {
        console.log('✅ Courts table has CourtListener fields')
      }

      // Check if new columns exist in judges table
      const { data: judgesTest, error: judgesError } = await this.supabase
        .from('judges')
        .select('id, courtlistener_id, positions')
        .limit(1)

      if (judgesError) {
        console.log('❌ Judges table verification failed:', judgesError.message)
        return false
      } else {
        console.log('✅ Judges table has CourtListener fields')
      }

      // Check if judge_court_positions table exists
      const { count, error: positionsError } = await this.supabase
        .from('judge_court_positions')
        .select('*', { count: 'exact', head: true })

      if (positionsError) {
        console.log('❌ Judge court positions table verification failed:', positionsError.message)
        return false
      } else {
        console.log(`✅ Judge court positions table exists (${count || 0} records)`)
      }

      console.log('\n🎉 All migration verifications passed!')
      return true

    } catch (error) {
      console.log('❌ Verification failed:', error.message)
      return false
    }
  }
}

// Main execution
async function main() {
  try {
    const executor = new DirectMigrationExecutor()
    const success = await executor.executeMigrations()
    
    if (success) {
      console.log('\n🎉 Database migrations completed successfully!')
      process.exit(0)
    } else {
      console.log('\n❌ Database migrations failed!')
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

module.exports = { DirectMigrationExecutor }