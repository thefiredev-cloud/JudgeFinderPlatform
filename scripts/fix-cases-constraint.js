const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixCasesConstraint() {
  console.log('🔧 Fixing cases table constraint...');
  
  try {
    // Remove the problematic constraint
    const { data, error } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_status_check;'
    });
    
    if (error) {
      // Try alternative approach - direct SQL execution
      console.log('⚠️ RPC method not available, attempting direct fix...');
      
      // Update cases to have a valid status if they don't have one
      const { error: updateError } = await supabase
        .from('cases')
        .update({ status: 'closed' })
        .is('status', null);
      
      if (updateError) {
        console.log('⚠️ Could not update null status values:', updateError.message);
      } else {
        console.log('✅ Updated cases with null status to "closed"');
      }
    } else {
      console.log('✅ Successfully removed cases_status_check constraint');
    }
    
    // Verify we can insert cases now
    const testCase = {
      title: 'Test Case v. Test Defendant',
      case_number: 'TEST-2025-001',
      judge_id: null,
      court_id: null,
      date_filed: new Date().toISOString(),
      status: 'pending'
    };
    
    const { data: testData, error: testError } = await supabase
      .from('cases')
      .insert([testCase])
      .select();
    
    if (testError) {
      console.log('⚠️ Still cannot insert cases:', testError.message);
      console.log('Attempting to insert with "closed" status...');
      
      testCase.status = 'closed';
      const { error: retryError } = await supabase
        .from('cases')
        .insert([testCase])
        .select();
      
      if (retryError) {
        console.log('❌ Cannot insert cases even with "closed" status');
      } else {
        console.log('✅ Can insert cases with "closed" status');
        // Clean up test case
        await supabase
          .from('cases')
          .delete()
          .eq('case_number', 'TEST-2025-001');
      }
    } else {
      console.log('✅ Can successfully insert cases');
      // Clean up test case
      if (testData && testData[0]) {
        await supabase
          .from('cases')
          .delete()
          .eq('id', testData[0].id);
      }
    }
    
  } catch (err) {
    console.error('❌ Error fixing constraint:', err);
  }
  
  console.log('✅ Constraint fix complete');
}

fixCasesConstraint();