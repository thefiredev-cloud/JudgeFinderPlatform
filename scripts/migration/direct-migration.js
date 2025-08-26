const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function applyUserTablesMigration() {
  const client = new Client({
    connectionString: process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', 'postgresql://postgres:') + process.env.SUPABASE_SERVICE_ROLE_KEY.split('.')[0] + '@' + process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1] + '.co:5432/postgres'
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Database connected successfully');

    console.log('📝 Reading user tables migration file...');
    const sqlContent = fs.readFileSync('scripts/create-user-tables.sql', 'utf8');
    
    console.log('⏳ Executing migration...');
    await client.query(sqlContent);
    
    console.log('🎉 User tables migration completed successfully!');
    
    // Verify tables were created
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_bookmarks', 'user_preferences', 'user_activity', 'user_saved_searches', 'user_notifications')
      ORDER BY table_name;
    `);
    
    console.log('📊 Created tables:', rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('🚨 Migration failed:', error.message);
    
    // Let's check if tables already exist
    try {
      const { rows } = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'user_%'
        ORDER BY table_name;
      `);
      
      if (rows.length > 0) {
        console.log('ℹ️  Existing user tables found:', rows.map(r => r.table_name));
        console.log('✅ User tables may already exist - migration may not be needed');
      }
    } catch (checkError) {
      console.error('Failed to check existing tables:', checkError.message);
    }
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

applyUserTablesMigration();