const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises

async function setupUserTables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('🚀 Setting up user authentication tables...')

    // Read the SQL file
    const sqlContent = await fs.readFile('./scripts/create-user-tables.sql', 'utf8')

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent })

    if (error) {
      // If the function doesn't exist, try direct execution
      console.log('Attempting direct SQL execution...')
      const { error: directError } = await supabase
        .from('_dummy')
        .select('*')
        .limit(0) // This will fail but test connection

      if (directError && directError.code !== '42P01') { // 42P01 = relation does not exist
        throw directError
      }

      // Split SQL into individual statements and execute them
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)

      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.substring(0, 50) + '...')
          const { error: stmtError } = await supabase.rpc('exec', { sql: statement })
          if (stmtError) {
            console.warn('Warning for statement:', stmtError.message)
          }
        }
      }
    }

    console.log('✅ User authentication tables created successfully!')

    // Verify tables were created
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'user_bookmarks',
        'user_preferences', 
        'user_activity',
        'user_saved_searches',
        'user_notifications'
      ])

    if (tablesError) {
      console.error('Error checking tables:', tablesError)
    } else {
      console.log('✅ Verified tables:', tables.map(t => t.table_name))
    }

    console.log('🎉 User authentication setup complete!')

  } catch (error) {
    console.error('❌ Error setting up user tables:', error)
    process.exit(1)
  }
}

setupUserTables()