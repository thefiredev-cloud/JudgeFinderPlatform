const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCasesSchema() {
  console.log('📊 Checking cases table schema...\n');
  
  // Get a sample case to see the structure
  const { data: sampleCase, error } = await supabase
    .from('cases')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Error fetching sample case:', error.message);
    return;
  }
  
  if (sampleCase && sampleCase.length > 0) {
    console.log('📋 Cases table columns:');
    console.log(Object.keys(sampleCase[0]));
    console.log('\n📄 Sample case structure:');
    console.log(JSON.stringify(sampleCase[0], null, 2));
  } else {
    console.log('⚠️ No cases found in database');
    
    // Try to get column information another way
    const { data: emptySelect, error: selectError } = await supabase
      .from('cases')
      .select()
      .limit(0);
    
    if (!selectError) {
      console.log('✅ Cases table exists and is accessible');
    }
  }
  
  // Check current case count
  const { count, error: countError } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true });
  
  if (!countError) {
    console.log(`\n📊 Total cases in database: ${count}`);
  }
  
  // Check status values
  const { data: statusValues, error: statusError } = await supabase
    .from('cases')
    .select('status')
    .limit(10);
  
  if (!statusError && statusValues) {
    const uniqueStatuses = [...new Set(statusValues.map(c => c.status))];
    console.log('\n📌 Current status values in use:');
    console.log(uniqueStatuses);
  }
}

checkCasesSchema();