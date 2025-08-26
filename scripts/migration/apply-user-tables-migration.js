const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyUserTablesMigration() {
  try {
    console.log('🚀 Starting user tables migration...');
    
    const sqlContent = fs.readFileSync('scripts/create-user-tables.sql', 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.trim() === '') continue;
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase
          .from('_temp_migration')
          .select('1')
          .limit(0);
        
        // If the above doesn't work, try using raw SQL execution
        const { data, error: sqlError } = await supabase
          .rpc('sql', { query: statement });
        
        if (sqlError) {
          console.log(`⚠️  Statement ${i + 1} error:`, sqlError.message);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Statement ${i + 1} failed:`, err.message);
        errorCount++;
      }
      
      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log(`🎉 User tables migration completed successfully!`);
    } else {
      console.log(`⚠️  Migration completed with ${errorCount} errors`);
    }
    
  } catch (error) {
    console.error('🚨 Migration failed:', error);
    process.exit(1);
  }
}

applyUserTablesMigration();