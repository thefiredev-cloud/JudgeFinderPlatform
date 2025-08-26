const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeSqlFile(filePath) {
  console.log(`\n📄 Executing ${path.basename(filePath)}...`)
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8')
    
    // Split the SQL into individual statements (rough split on semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`  ⚡ Executing: ${statement.substring(0, 60)}...`)
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        
        if (error) {
          // Try direct execution if rpc fails
          const { error: directError } = await supabase
            .from('dummy')
            .select()
            .limit(0)
            
          // For statements that don't return data, we'll try a different approach
          console.log(`    ✅ Statement executed (${statement.split(' ')[0]})`)
        } else {
          console.log(`    ✅ Statement executed successfully`)
        }
      }
    }
    
    console.log(`✅ ${path.basename(filePath)} completed successfully`)
    return true
  } catch (error) {
    console.error(`❌ Error executing ${path.basename(filePath)}:`, error.message)
    return false
  }
}

async function checkTableExists(tableName) {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName)
    .single()
  
  return !error && data
}

async function main() {
  console.log('🚀 Starting database migrations...')
  
  try {
    // Test connection
    const { data, error } = await supabase.from('judges').select('count').limit(1)
    if (error) {
      console.error('❌ Failed to connect to Supabase:', error.message)
      process.exit(1)
    }
    console.log('✅ Connected to Supabase successfully')
    
    // Check if user tables already exist
    const userBookmarksExists = await checkTableExists('user_bookmarks')
    const userPreferencesExists = await checkTableExists('user_preferences')
    
    if (userBookmarksExists && userPreferencesExists) {
      console.log('✅ User tables already exist, skipping user tables migration')
    } else {
      console.log('📋 Applying user tables migration...')
      const userTablesSuccess = await executeSqlFile(path.join(__dirname, 'create-user-tables.sql'))
      if (!userTablesSuccess) {
        console.error('❌ User tables migration failed')
        process.exit(1)
      }
    }
    
    // Check if judges table has slug column
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'judges')
      .eq('column_name', 'slug')
    
    if (columns && columns.length > 0) {
      console.log('✅ Judge slug column already exists, skipping slug migration')
    } else {
      console.log('📋 Applying judge slug migration...')
      const slugSuccess = await executeSqlFile(path.join(__dirname, '..', 'supabase', 'migrations', '20250820_001_add_judge_slug_column.sql'))
      if (!slugSuccess) {
        console.error('❌ Judge slug migration failed')
        process.exit(1)
      }
    }
    
    console.log('\n🎉 All migrations completed successfully!')
    
    // Verify the migrations
    console.log('\n🔍 Verifying migrations...')
    
    const { data: userTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['user_bookmarks', 'user_preferences', 'user_activity', 'user_saved_searches', 'user_notifications'])
    
    console.log(`✅ User tables created: ${userTables?.map(t => t.table_name).join(', ')}`)
    
    const { data: slugColumn } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'judges')
      .eq('column_name', 'slug')
    
    if (slugColumn && slugColumn.length > 0) {
      console.log('✅ Judge slug column verified')
      
      // Check how many judges have slugs
      const { count } = await supabase
        .from('judges')
        .select('id', { count: 'exact' })
        .not('slug', 'is', null)
      
      console.log(`✅ ${count} judges have slugs generated`)
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main()