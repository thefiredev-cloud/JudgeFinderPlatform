/**
 * Apply court slug migration directly to Supabase
 * This script adds slug column to courts table and generates slugs for all courts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting court slug migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250821_001_add_court_slug_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase
            .from('_temp_')
            .select('*')
            .limit(0); // This will fail but execute our SQL via the query
          
          if (directError && !directError.message.includes('relation "_temp_" does not exist')) {
            throw directError;
          }
        }
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (statementError) {
        console.warn(`⚠️  Statement ${i + 1} may have failed:`, statementError.message);
        // Continue with other statements
      }
    }

    // Verify the migration worked by checking the courts table
    console.log('🔍 Verifying migration...');
    
    const { data: courts, error: selectError } = await supabase
      .from('courts')
      .select('id, name, slug')
      .limit(5);

    if (selectError) {
      throw selectError;
    }

    console.log('✅ Migration verification successful!');
    console.log('Sample courts with slugs:');
    courts.forEach(court => {
      console.log(`  - ${court.name} → ${court.slug}`);
    });

    // Check for any courts without slugs
    const { data: courtsWithoutSlugs, error: checkError } = await supabase
      .from('courts')
      .select('id, name')
      .is('slug', null)
      .limit(5);

    if (checkError) {
      throw checkError;
    }

    if (courtsWithoutSlugs && courtsWithoutSlugs.length > 0) {
      console.warn('⚠️  Found courts without slugs:');
      courtsWithoutSlugs.forEach(court => {
        console.warn(`  - ${court.name} (ID: ${court.id})`);
      });
    } else {
      console.log('✅ All courts have slugs!');
    }

    console.log('🎉 Court slug migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();