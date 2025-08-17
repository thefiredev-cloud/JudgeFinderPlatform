#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMissingTable() {
  console.log('🏗️ Creating judge_court_positions table...\n');

  try {
    // Create the judge_court_positions table
    const { error } = await supabase.rpc('exec_sql', {
      query: `
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
            
            -- Foreign key constraints
            CONSTRAINT fk_judge_court_positions_judge_id 
                FOREIGN KEY (judge_id) REFERENCES judges(id) ON DELETE CASCADE,
            CONSTRAINT fk_judge_court_positions_court_id 
                FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE,
            
            -- Ensure unique active positions per judge-court combination
            CONSTRAINT unique_active_judge_court_position 
                UNIQUE(judge_id, court_id, status, position_type) 
                DEFERRABLE INITIALLY DEFERRED
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_judge_court_positions_judge_id ON judge_court_positions(judge_id);
        CREATE INDEX IF NOT EXISTS idx_judge_court_positions_court_id ON judge_court_positions(court_id);
        CREATE INDEX IF NOT EXISTS idx_judge_court_positions_status ON judge_court_positions(status);

        -- Add check constraints for data integrity
        ALTER TABLE judge_court_positions 
        ADD CONSTRAINT IF NOT EXISTS check_valid_status
            CHECK (status IN ('active', 'inactive', 'retired', 'resigned', 'transferred', 'deceased'));

        ALTER TABLE judge_court_positions
        ADD CONSTRAINT IF NOT EXISTS check_valid_position_type
            CHECK (position_type IN (
                'Judge', 'Chief Judge', 'Presiding Judge', 'Associate Judge', 
                'Senior Judge', 'Retired Judge', 'Acting Judge', 'Pro Tem Judge',
                'Magistrate Judge', 'Administrative Judge', 'Deputy Judge'
            ));
      `
    });

    if (error) {
      console.error('❌ Error creating table via RPC:', error);
      
      // Try alternative approach using raw SQL execution
      console.log('🔄 Trying alternative approach...');
      
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS judge_court_positions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
            court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
            position_type VARCHAR(100) NOT NULL DEFAULT 'Judge',
            appointment_date DATE,
            start_date DATE,
            end_date DATE,
            status VARCHAR(50) NOT NULL DEFAULT 'active',
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      const { error: tableError } = await supabase
        .from('judge_court_positions')
        .select('*')
        .limit(1);

      if (tableError && tableError.message.includes('does not exist')) {
        console.log('📋 Table does not exist. Creating via direct query...');
        
        // Use raw query approach
        const { error: rawError } = await supabase
          .from('_realtime_channel') // This is just to get a connection
          .select('*')
          .limit(0);

        console.log('⚠️ Unable to create table directly. Please execute this SQL in Supabase dashboard:');
        console.log('='.repeat(70));
        console.log(createTableQuery);
        console.log('='.repeat(70));
        
        return false;
      }
    }

    console.log('✅ Table creation completed!');
    return true;

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return false;
  }
}

async function verifyTableExists() {
  try {
    const { data, error } = await supabase
      .from('judge_court_positions')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Table does not exist:', error.message);
      return false;
    }

    console.log('✅ Table exists and is accessible');
    return true;
  } catch (error) {
    console.log('❌ Error checking table:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Creating missing database table...\n');
  
  const exists = await verifyTableExists();
  
  if (!exists) {
    const created = await createMissingTable();
    
    if (created) {
      await verifyTableExists();
    }
  } else {
    console.log('✅ Table already exists!');
  }
  
  console.log('\n✅ Process completed!');
  process.exit(0);
}

main();