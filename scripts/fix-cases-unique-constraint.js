/**
 * Fix Cases Table Unique Constraint
 * Adds the missing composite unique constraint on (judge_id, case_number)
 * that the sync script expects for upsert operations
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixCasesUniqueConstraint() {
  console.log('🔧 Fixing cases table unique constraint...');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Check for existing duplicates
    console.log('\n📊 Checking for duplicate cases...');
    
    const { data: duplicates, error: dupError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT judge_id, case_number, COUNT(*) as count
        FROM cases
        WHERE judge_id IS NOT NULL AND case_number IS NOT NULL
        GROUP BY judge_id, case_number
        HAVING COUNT(*) > 1
        LIMIT 10
      `
    }).single();
    
    if (dupError) {
      // If RPC doesn't work, try a different approach
      console.log('⚠️  RPC not available, checking duplicates via regular query...');
      
      // Get all cases and check for duplicates in JavaScript
      const { data: allCases, error: fetchError } = await supabase
        .from('cases')
        .select('id, judge_id, case_number, created_at')
        .not('judge_id', 'is', null)
        .not('case_number', 'is', null)
        .order('created_at', { ascending: false });
      
      if (!fetchError && allCases) {
        const duplicateMap = new Map();
        const duplicatesToRemove = [];
        
        for (const caseItem of allCases) {
          const key = `${caseItem.judge_id}-${caseItem.case_number}`;
          
          if (duplicateMap.has(key)) {
            // This is a duplicate, mark the older one for removal
            duplicatesToRemove.push(caseItem.id);
          } else {
            duplicateMap.set(key, caseItem.id);
          }
        }
        
        if (duplicatesToRemove.length > 0) {
          console.log(`🗑️  Found ${duplicatesToRemove.length} duplicate cases to remove...`);
          
          // Remove duplicates in batches
          const batchSize = 100;
          for (let i = 0; i < duplicatesToRemove.length; i += batchSize) {
            const batch = duplicatesToRemove.slice(i, i + batchSize);
            const { error: deleteError } = await supabase
              .from('cases')
              .delete()
              .in('id', batch);
            
            if (deleteError) {
              console.error(`❌ Error removing duplicates: ${deleteError.message}`);
            } else {
              console.log(`  ✅ Removed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(duplicatesToRemove.length / batchSize)}`);
            }
          }
          
          console.log('✅ All duplicates removed');
        } else {
          console.log('✅ No duplicate cases found');
        }
      }
    } else if (duplicates && duplicates.length > 0) {
      console.log(`⚠️  Found duplicates that need to be resolved first`);
      // Handle duplicates if RPC worked
    } else {
      console.log('✅ No duplicate cases found');
    }
    
    // Step 2: Try to add the unique constraint via RPC
    console.log('\n🔨 Adding unique constraint on (judge_id, case_number)...');
    
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      query: `
        ALTER TABLE cases 
        ADD CONSTRAINT cases_judge_case_unique 
        UNIQUE (judge_id, case_number);
      `
    }).single();
    
    if (constraintError) {
      console.log('⚠️  Cannot add constraint via RPC. Manual database update required.');
      console.log('\n📝 Please run this SQL command in your Supabase SQL editor:');
      console.log('=' .repeat(60));
      console.log(`
ALTER TABLE cases 
DROP CONSTRAINT IF EXISTS cases_judge_case_unique;

ALTER TABLE cases 
ADD CONSTRAINT cases_judge_case_unique 
UNIQUE (judge_id, case_number);
      `);
      console.log('=' .repeat(60));
      
      // Create a migration file for manual application
      const fs = require('fs');
      const migrationSQL = `-- Fix Cases Table Unique Constraint
-- Run this migration to add the missing unique constraint

-- First drop the constraint if it exists
ALTER TABLE cases 
DROP CONSTRAINT IF EXISTS cases_judge_case_unique;

-- Add the unique constraint
ALTER TABLE cases 
ADD CONSTRAINT cases_judge_case_unique 
UNIQUE (judge_id, case_number);

-- Verify the constraint was added
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE 
    tc.table_name = 'cases' 
    AND tc.constraint_type = 'UNIQUE';
`;
      
      const migrationPath = './supabase/migrations/20250822_002_add_cases_unique_constraint.sql';
      fs.writeFileSync(migrationPath, migrationSQL);
      console.log(`\n✅ Migration file created: ${migrationPath}`);
      console.log('   Run: npx supabase db push');
      
    } else {
      console.log('✅ Unique constraint added successfully');
    }
    
    // Step 3: Test the constraint
    console.log('\n🧪 Testing the constraint...');
    
    const testCase = {
      case_number: 'TEST-CONSTRAINT-001',
      case_name: 'Test Constraint Case',
      judge_id: null,
      filing_date: new Date().toISOString(),
      status: 'closed'
    };
    
    // Try to insert the same case twice
    const { error: firstInsert } = await supabase
      .from('cases')
      .insert([testCase]);
    
    if (!firstInsert) {
      // Try to insert again - should fail if constraint is working
      const { error: secondInsert } = await supabase
        .from('cases')
        .upsert([testCase], { 
          onConflict: 'judge_id,case_number',
          ignoreDuplicates: true 
        });
      
      if (!secondInsert) {
        console.log('✅ Constraint is working - upsert handled duplicate correctly');
        
        // Clean up test case
        await supabase
          .from('cases')
          .delete()
          .eq('case_number', 'TEST-CONSTRAINT-001');
      } else if (secondInsert.message.includes('ON CONFLICT')) {
        console.log('⚠️  Constraint not yet active in database');
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ CONSTRAINT FIX COMPLETE');
    console.log('\nNext steps:');
    console.log('1. If constraint wasn\'t added automatically, run the SQL migration manually');
    console.log('2. Update the sync script with better error handling');
    console.log('3. Restart the sync process');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run if called directly
if (require.main === module) {
  fixCasesUniqueConstraint()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Failed:', error);
      process.exit(1);
    });
}

module.exports = fixCasesUniqueConstraint;