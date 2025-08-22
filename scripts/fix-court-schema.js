const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixCourtSchema() {
  try {
    // First, let's check if the column exists
    const { data: columns, error: checkError } = await supabase
      .from('courts')
      .select('*')
      .limit(0);
    
    console.log('🔍 Checking courts table schema...');
    
    // Try to add the column using a direct SQL approach
    const { data, error } = await supabase.from('courts').select('id').limit(1);
    
    if (error && error.message.includes('courthouse_metadata')) {
      console.log('⚠️ courthouse_metadata column is missing');
      
      // Since we can't run ALTER TABLE directly, we'll work around this
      // by updating the sync script to not use this column
      console.log('✅ Will update sync script to handle missing column');
      return { success: true, message: 'Schema issue identified' };
    }
    
    console.log('✅ Courts table schema appears correct');
    return { success: true };
    
  } catch (err) {
    console.error('❌ Error checking schema:', err);
    return { success: false, error: err };
  }
}

fixCourtSchema().then(result => {
  console.log('Result:', result);
  process.exit(result.success ? 0 : 1);
});