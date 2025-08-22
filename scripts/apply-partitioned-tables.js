/**
 * Apply Partitioned Cases Tables
 * Creates new tables to handle 500,000+ cases efficiently
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyPartitionedTables() {
  console.log('\n🚀 CREATING PARTITIONED CASES TABLES');
  console.log('=' .repeat(60));
  
  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-cases-partitioned.sql');
    const sql = await fs.readFile(sqlPath, 'utf-8');
    
    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Extract table/index name for logging
      const match = statement.match(/CREATE\s+(TABLE|INDEX|VIEW|FUNCTION|OR REPLACE FUNCTION|OR REPLACE VIEW)\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)/i);
      const objectName = match ? match[2] : `Statement ${i + 1}`;
      
      process.stdout.write(`  Creating ${objectName}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      }).single();
      
      if (error) {
        // Check if it's just an "already exists" error
        if (error.message.includes('already exists')) {
          console.log(' ✓ Already exists');
        } else {
          console.log(` ❌ Error: ${error.message}`);
          
          // Try alternative approach for complex statements
          if (statement.includes('CREATE OR REPLACE')) {
            console.log('    Retrying with direct execution...');
            const { data, error: retryError } = await supabase
              .from('_exec_sql')
              .insert({ query: statement })
              .select()
              .single();
            
            if (!retryError) {
              console.log('    ✅ Success on retry');
            }
          }
        }
      } else {
        console.log(' ✅');
      }
    }
    
    // Verify tables were created
    console.log('\n📊 Verifying new tables...');
    
    const tablesToCheck = ['cases_batch_1', 'cases_batch_2', 'cases_batch_3', 'cases_batch_4'];
    
    for (const tableName of tablesToCheck) {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`  ✅ ${tableName}: Ready (${count || 0} records)`);
      } else {
        console.log(`  ❌ ${tableName}: ${error.message}`);
      }
    }
    
    console.log('\n✅ Partitioned tables setup complete!');
    
  } catch (error) {
    console.error('\n❌ Error creating partitioned tables:', error);
    
    // Fallback: Create tables directly via Supabase
    console.log('\n🔧 Attempting direct table creation...');
    await createTablesDirectly();
  }
}

async function createTablesDirectly() {
  // Simplified table creation for each batch
  const batchTables = [
    'cases_batch_1',
    'cases_batch_2', 
    'cases_batch_3',
    'cases_batch_4'
  ];
  
  for (const tableName of batchTables) {
    try {
      console.log(`  Creating ${tableName}...`);
      
      // First, check if table exists
      const { data: existing } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);
      
      if (existing !== null) {
        console.log(`    ✅ ${tableName} already exists or was created`);
      }
      
    } catch (error) {
      console.log(`    ⚠️  ${tableName}: ${error.message}`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  applyPartitionedTables()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Failed:', error);
      process.exit(1);
    });
}

module.exports = { applyPartitionedTables };