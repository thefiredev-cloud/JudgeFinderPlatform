const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndCreateUserTables() {
  try {
    console.log('🔍 Checking existing user tables...');
    
    // Check if user tables already exist
    const tables = ['user_bookmarks', 'user_preferences', 'user_activity', 'user_saved_searches', 'user_notifications'];
    const existingTables = [];
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          existingTables.push(tableName);
        }
      } catch (err) {
        // Table doesn't exist
      }
    }
    
    if (existingTables.length === tables.length) {
      console.log('✅ All user tables already exist:', existingTables);
      return true;
    }
    
    if (existingTables.length > 0) {
      console.log('⚠️  Some user tables exist:', existingTables);
      console.log('📝 Missing tables:', tables.filter(t => !existingTables.includes(t)));
    } else {
      console.log('📝 No user tables found - need to create them');
    }
    
    // Since direct SQL execution isn't working, let's create a simpler approach
    // using the existing migration scripts
    console.log('🔄 Attempting to run existing migration script...');
    
    const { execSync } = require('child_process');
    
    try {
      // Try to run the existing migration script
      const result = execSync('node scripts/run-database-migrations.js', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log('📊 Migration script output:', result);
      return true;
    } catch (migrationError) {
      console.log('⚠️  Migration script failed, continuing with manual approach...');
    }
    
    // If all else fails, let's just proceed with the rest of the fixes
    // The user tables can be created manually if needed
    console.log('ℹ️  User tables migration will need to be completed manually');
    console.log('💡 Run this SQL manually in Supabase dashboard:');
    console.log('📄 File: scripts/create-user-tables.sql');
    
    return false;
    
  } catch (error) {
    console.error('🚨 Error checking user tables:', error.message);
    return false;
  }
}

checkAndCreateUserTables().then(success => {
  if (success) {
    console.log('🎉 User tables are ready!');
  } else {
    console.log('⚠️  User tables need manual setup');
  }
});