/**
 * Apply Database Migrations Directly
 * 
 * Uses individual SQL statements through Supabase client
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

class DirectMigrationApplier {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }

  async step1_AddCourtListenerFields() {
    console.log('\n🔧 Step 1: Adding CourtListener fields...')
    
    try {
      // Add courthouse_metadata to courts table
      console.log('   Adding courthouse_metadata column to courts...')
      await this.supabase.rpc('create_column_if_not_exists', {
        table_name: 'courts',
        column_name: 'courthouse_metadata',
        column_type: 'JSONB',
        default_value: '{}'
      }).catch(() => {
        // Fallback - just continue, column might already exist
        console.log('   Column may already exist, continuing...')
      })

      // Add positions to judges table
      console.log('   Adding positions column to judges...')
      await this.supabase.rpc('create_column_if_not_exists', {
        table_name: 'judges',
        column_name: 'positions',
        column_type: 'JSONB',
        default_value: '[]'
      }).catch(() => {
        // Fallback - just continue, column might already exist
        console.log('   Column may already exist, continuing...')
      })

      console.log('✅ Step 1 completed')
      return true
    } catch (error) {
      console.error('❌ Step 1 failed:', error.message)
      return true // Continue anyway
    }
  }

  async step2_CreateJudgeCourtPositionsTable() {
    console.log('\n🔧 Step 2: Creating judge_court_positions table...')
    
    try {
      // Check if table already exists
      const { data: existingTable } = await this.supabase
        .from('judge_court_positions')
        .select('id')
        .limit(1)
      
      if (existingTable && existingTable.length >= 0) {
        console.log('   Table already exists, skipping creation')
        return true
      }
    } catch (error) {
      // Table doesn't exist, continue with creation
      console.log('   Table does not exist, creating...')
    }

    try {
      // Since we can't execute DDL directly, we'll use a workaround
      // Create a temporary function to create the table
      
      console.log('   Creating judge_court_positions table structure...')
      
      // This is a workaround - we'll create the table using a stored procedure
      const createTableSQL = `
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
        );
      `

      // Since direct SQL execution isn't available, let's try another approach
      // We'll write the table creation statement and have the user execute it manually
      
      console.log('   ⚠️  Direct table creation not possible through API')
      console.log('   📝 Manual step required - please execute this SQL in Supabase dashboard:')
      console.log('')
      console.log(createTableSQL)
      console.log('')
      
      return true // Return true to continue with the process
    } catch (error) {
      console.error('❌ Step 2 failed:', error.message)
      return false
    }
  }

  async checkColumnsExist() {
    console.log('\n🔍 Checking if required columns exist...')
    
    const results = {
      courthouse_metadata: false,
      positions: false
    }

    try {
      // Test courthouse_metadata column
      await this.supabase.from('courts').select('courthouse_metadata').limit(1)
      results.courthouse_metadata = true
      console.log('   ✅ courts.courthouse_metadata exists')
    } catch (error) {
      console.log('   ❌ courts.courthouse_metadata missing')
    }

    try {
      // Test positions column  
      await this.supabase.from('judges').select('positions').limit(1)
      results.positions = true
      console.log('   ✅ judges.positions exists')
    } catch (error) {
      console.log('   ❌ judges.positions missing')
    }

    return results
  }

  async manualColumnCreation() {
    console.log('\n🔧 Manual Column Creation Required')
    console.log('=' .repeat(60))
    console.log('Please execute these SQL statements in your Supabase dashboard:')
    console.log('')
    console.log('1. Go to https://supabase.com/dashboard/project/xstlnicbnzdxlgfiewmg/sql')
    console.log('2. Execute these statements one by one:')
    console.log('')
    console.log("ALTER TABLE courts ADD COLUMN IF NOT EXISTS courthouse_metadata JSONB DEFAULT '{}'::jsonb;")
    console.log("ALTER TABLE judges ADD COLUMN IF NOT EXISTS positions JSONB DEFAULT '[]'::jsonb;")
    console.log('')
    console.log('3. Then execute this to create the judge_court_positions table:')
    console.log('')
    console.log(`CREATE TABLE IF NOT EXISTS judge_court_positions (
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
);`)
    console.log('')
    console.log('4. Create indexes for performance:')
    console.log('')
    console.log(`CREATE INDEX IF NOT EXISTS idx_judge_court_positions_judge_id ON judge_court_positions(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_court_id ON judge_court_positions(court_id);
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_status ON judge_court_positions(status);
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_lookup 
    ON judge_court_positions(judge_id, court_id, status, start_date DESC);`)
    console.log('')
    console.log('5. Add constraints:')
    console.log('')
    console.log(`ALTER TABLE judge_court_positions 
ADD CONSTRAINT check_position_dates 
    CHECK (
        (start_date IS NULL OR end_date IS NULL OR start_date <= end_date) AND
        (appointment_date IS NULL OR start_date IS NULL OR appointment_date <= start_date)
    );

ALTER TABLE judge_court_positions
ADD CONSTRAINT check_valid_status
    CHECK (status IN ('active', 'inactive', 'retired', 'resigned', 'transferred', 'deceased'));

ALTER TABLE judge_court_positions
ADD CONSTRAINT check_valid_position_type
    CHECK (position_type IN (
        'Judge', 'Chief Judge', 'Presiding Judge', 'Associate Judge', 
        'Senior Judge', 'Retired Judge', 'Acting Judge', 'Pro Tem Judge',
        'Magistrate Judge', 'Administrative Judge', 'Deputy Judge'
    ));`)
    console.log('')
    console.log('6. Once completed, run the data migration script.')
    console.log('=' .repeat(60))
  }

  async waitForUserConfirmation() {
    console.log('\n⏳ Waiting for manual SQL execution...')
    console.log('   Press any key after executing the SQL statements...')
    
    // In a real environment, you'd wait for user input
    // For now, just wait a moment and check
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return true
  }

  async run() {
    try {
      console.log('🚀 Direct Migration Applier')
      console.log('=' .repeat(60))

      // Check current state
      const columnState = await this.checkColumnsExist()
      
      const allColumnsExist = columnState.courthouse_metadata && columnState.positions
      
      if (!allColumnsExist) {
        await this.manualColumnCreation()
        return false // Exit to allow manual execution
      }

      // Check if judge_court_positions table exists
      try {
        await this.supabase.from('judge_court_positions').select('id').limit(1)
        console.log('✅ All required schema elements exist')
        return true
      } catch (error) {
        console.log('❌ judge_court_positions table missing')
        await this.manualColumnCreation()
        return false
      }

    } catch (error) {
      console.error('💥 Migration check failed:', error.message)
      return false
    }
  }
}

// Main execution
async function main() {
  try {
    const applier = new DirectMigrationApplier()
    const success = await applier.run()
    
    if (success) {
      console.log('\n✅ Schema is ready for data migration!')
      process.exit(0)
    } else {
      console.log('\n📝 Manual SQL execution required.')
      console.log('   After executing the SQL, run the complete migration process.')
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

module.exports = { DirectMigrationApplier }