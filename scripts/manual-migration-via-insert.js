/**
 * Manual Database Migration using Supabase Client Operations
 * 
 * Since we can't execute DDL statements directly through Supabase's REST API,
 * we'll need to execute these migrations manually through the Supabase dashboard
 * or use this script to verify the current state and guide manual execution.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

class ManualMigrationGuide {
  constructor() {
    this.validateEnvironment()
    
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('🔍 Manual Migration Guide initialized')
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
   * Check current database schema state
   */
  async checkCurrentState() {
    console.log('🔍 Checking current database state...')
    
    try {
      // Check courts table structure
      const { data: courtsTest, error: courtsError } = await this.supabase
        .from('courts')
        .select('id, courtlistener_id, courthouse_metadata')
        .limit(1)

      if (courtsError) {
        if (courtsError.message.includes('courtlistener_id')) {
          console.log('❌ Courts table missing: courtlistener_id column')
        }
        if (courtsError.message.includes('courthouse_metadata')) {
          console.log('❌ Courts table missing: courthouse_metadata column')
        }
      } else {
        console.log('✅ Courts table has CourtListener fields')
      }

      // Check judges table structure
      const { data: judgesTest, error: judgesError } = await this.supabase
        .from('judges')
        .select('id, courtlistener_id, positions')
        .limit(1)

      if (judgesError) {
        if (judgesError.message.includes('courtlistener_id')) {
          console.log('❌ Judges table missing: courtlistener_id column')
        }
        if (judgesError.message.includes('positions')) {
          console.log('❌ Judges table missing: positions column')
        }
      } else {
        console.log('✅ Judges table has CourtListener fields')
      }

      // Check judge_court_positions table
      const { count, error: positionsError } = await this.supabase
        .from('judge_court_positions')
        .select('*', { count: 'exact', head: true })

      if (positionsError) {
        console.log('❌ Judge court positions table does not exist')
      } else {
        console.log(`✅ Judge court positions table exists (${count || 0} records)`)
      }

      return {
        courtsReady: !courtsError,
        judgesReady: !judgesError,
        positionsTableExists: !positionsError
      }

    } catch (error) {
      console.error('❌ Error checking database state:', error.message)
      return {
        courtsReady: false,
        judgesReady: false,
        positionsTableExists: false
      }
    }
  }

  /**
   * Generate SQL migration statements for manual execution
   */
  generateMigrationSQL() {
    console.log('\n📋 SQL Migration Statements for Manual Execution')
    console.log('=' .repeat(70))
    console.log('Copy and paste these statements into your Supabase SQL Editor:')
    console.log('=' .repeat(70))

    const statements = [
      '-- Step 1: Add CourtListener fields to courts table',
      'ALTER TABLE courts ADD COLUMN IF NOT EXISTS courtlistener_id VARCHAR(50);',
      'ALTER TABLE courts ADD COLUMN IF NOT EXISTS courthouse_metadata JSONB DEFAULT \'{}\'::jsonb;',
      '',
      '-- Step 2: Add CourtListener fields to judges table',
      'ALTER TABLE judges ADD COLUMN IF NOT EXISTS courtlistener_id VARCHAR(50);',
      'ALTER TABLE judges ADD COLUMN IF NOT EXISTS positions JSONB DEFAULT \'[]\'::jsonb;',
      '',
      '-- Step 3: Create indexes for performance',
      'CREATE INDEX IF NOT EXISTS idx_courts_courtlistener_id ON courts(courtlistener_id) WHERE courtlistener_id IS NOT NULL;',
      'CREATE INDEX IF NOT EXISTS idx_judges_courtlistener_id ON judges(courtlistener_id) WHERE courtlistener_id IS NOT NULL;',
      'CREATE INDEX IF NOT EXISTS idx_judges_jurisdiction ON judges(jurisdiction);',
      '',
      '-- Step 4: Add unique constraints',
      'ALTER TABLE courts ADD CONSTRAINT IF NOT EXISTS courts_courtlistener_id_unique UNIQUE(courtlistener_id);',
      'ALTER TABLE judges ADD CONSTRAINT IF NOT EXISTS judges_courtlistener_id_unique UNIQUE(courtlistener_id);',
      '',
      '-- Step 5: Create judge_court_positions table',
      'CREATE TABLE IF NOT EXISTS judge_court_positions (',
      '    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),',
      '    judge_id UUID NOT NULL,',
      '    court_id UUID NOT NULL,',
      '    position_type VARCHAR(100) NOT NULL DEFAULT \'Judge\',',
      '    appointment_date DATE,',
      '    start_date DATE,',
      '    end_date DATE,',
      '    status VARCHAR(50) NOT NULL DEFAULT \'active\',',
      '    metadata JSONB DEFAULT \'{}\'::jsonb,',
      '    created_at TIMESTAMPTZ DEFAULT NOW(),',
      '    updated_at TIMESTAMPTZ DEFAULT NOW(),',
      '    ',
      '    -- Foreign key constraints',
      '    CONSTRAINT fk_judge_court_positions_judge_id ',
      '        FOREIGN KEY (judge_id) REFERENCES judges(id) ON DELETE CASCADE,',
      '    CONSTRAINT fk_judge_court_positions_court_id ',
      '        FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE,',
      '    ',
      '    -- Ensure unique active positions per judge-court combination',
      '    CONSTRAINT unique_active_judge_court_position ',
      '        UNIQUE(judge_id, court_id, status, position_type) ',
      '        DEFERRABLE INITIALLY DEFERRED',
      ');',
      '',
      '-- Step 6: Create indexes for judge_court_positions',
      'CREATE INDEX IF NOT EXISTS idx_judge_court_positions_judge_id ON judge_court_positions(judge_id);',
      'CREATE INDEX IF NOT EXISTS idx_judge_court_positions_court_id ON judge_court_positions(court_id);',
      'CREATE INDEX IF NOT EXISTS idx_judge_court_positions_status ON judge_court_positions(status);',
      'CREATE INDEX IF NOT EXISTS idx_judge_court_positions_dates ON judge_court_positions(start_date, end_date);',
      'CREATE INDEX IF NOT EXISTS idx_judge_court_positions_type ON judge_court_positions(position_type);',
      'CREATE INDEX IF NOT EXISTS idx_judge_court_positions_lookup ON judge_court_positions(judge_id, court_id, status, start_date DESC);',
      '',
      '-- Step 7: Add check constraints for data integrity',
      'ALTER TABLE judge_court_positions ADD CONSTRAINT IF NOT EXISTS check_position_dates ',
      '    CHECK (',
      '        (start_date IS NULL OR end_date IS NULL OR start_date <= end_date) AND',
      '        (appointment_date IS NULL OR start_date IS NULL OR appointment_date <= start_date)',
      '    );',
      '',
      'ALTER TABLE judge_court_positions ADD CONSTRAINT IF NOT EXISTS check_valid_status',
      '    CHECK (status IN (\'active\', \'inactive\', \'retired\', \'resigned\', \'transferred\', \'deceased\'));',
      '',
      'ALTER TABLE judge_court_positions ADD CONSTRAINT IF NOT EXISTS check_valid_position_type',
      '    CHECK (position_type IN (',
      '        \'Judge\', \'Chief Judge\', \'Presiding Judge\', \'Associate Judge\', ',
      '        \'Senior Judge\', \'Retired Judge\', \'Acting Judge\', \'Pro Tem Judge\',',
      '        \'Magistrate Judge\', \'Administrative Judge\', \'Deputy Judge\'',
      '    ));',
      '',
      '-- Step 8: Create trigger function for updated_at',
      'CREATE OR REPLACE FUNCTION update_judge_court_positions_updated_at()',
      'RETURNS TRIGGER AS $$',
      'BEGIN',
      '    NEW.updated_at = NOW();',
      '    RETURN NEW;',
      'END;',
      '$$ LANGUAGE plpgsql;',
      '',
      '-- Step 9: Create trigger',
      'CREATE TRIGGER IF NOT EXISTS trigger_judge_court_positions_updated_at',
      '    BEFORE UPDATE ON judge_court_positions',
      '    FOR EACH ROW',
      '    EXECUTE FUNCTION update_judge_court_positions_updated_at();'
    ]

    statements.forEach(statement => {
      console.log(statement)
    })

    console.log('\n=' .repeat(70))
    console.log('END OF MIGRATION STATEMENTS')
    console.log('=' .repeat(70))
  }

  /**
   * Create backup before manual migration
   */
  async createBackup() {
    try {
      console.log('\n💾 Creating backup before manual migration...')
      
      // Backup judges table
      const { data: judges, error: judgesError } = await this.supabase
        .from('judges')
        .select('*')
        .order('created_at', { ascending: true })

      if (judgesError) {
        throw new Error(`Failed to backup judges: ${judgesError.message}`)
      }

      // Backup courts table
      const { data: courts, error: courtsError } = await this.supabase
        .from('courts')
        .select('*')
        .order('created_at', { ascending: true })

      if (courtsError) {
        throw new Error(`Failed to backup courts: ${courtsError.message}`)
      }

      const backupData = {
        timestamp: new Date().toISOString(),
        migration_version: 'pre_manual_migration',
        judges: judges,
        courts: courts,
        counts: {
          judges: judges.length,
          courts: courts.length
        }
      }

      const fs = require('fs').promises
      const path = require('path')
      const backupPath = path.join(__dirname, `manual-migration-backup-${Date.now()}.json`)
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2))
      
      console.log(`✅ Backup created: ${backupPath}`)
      console.log(`📊 Backed up ${judges.length} judges and ${courts.length} courts`)
      
      return backupPath
    } catch (error) {
      console.error('❌ Failed to create backup:', error.message)
      throw error
    }
  }

  async run() {
    try {
      console.log('🚀 Manual Migration Guide')
      console.log('=' .repeat(50))

      // Create backup
      await this.createBackup()

      // Check current state
      const state = await this.checkCurrentState()

      // Generate migration SQL
      this.generateMigrationSQL()

      console.log('\n📋 Next Steps:')
      console.log('1. Open your Supabase project dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Copy and paste the SQL statements above')
      console.log('4. Execute the statements one by one or all at once')
      console.log('5. Run the verification script after completion')

      console.log('\n🔍 Current Migration Status:')
      console.log(`   Courts table ready: ${state.courtsReady ? '✅' : '❌'}`)
      console.log(`   Judges table ready: ${state.judgesReady ? '✅' : '❌'}`)
      console.log(`   Positions table exists: ${state.positionsTableExists ? '✅' : '❌'}`)

      if (state.courtsReady && state.judgesReady && state.positionsTableExists) {
        console.log('\n🎉 All migrations appear to be complete!')
        console.log('You can proceed to run the data migration script.')
      } else {
        console.log('\n⚠️  Some migrations are still needed.')
        console.log('Please execute the SQL statements above in your Supabase dashboard.')
      }

      return true
    } catch (error) {
      console.error('💥 Error in manual migration guide:', error.message)
      return false
    }
  }
}

// Main execution
async function main() {
  try {
    const guide = new ManualMigrationGuide()
    await guide.run()
    console.log('\n✅ Manual migration guide completed!')
  } catch (error) {
    console.error('💥 Unhandled error:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { ManualMigrationGuide }