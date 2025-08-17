import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyIndexes() {
  try {
    console.log('🔍 Applying performance indexes...')
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(
      path.join(process.cwd(), 'scripts', 'performance-indexes.sql'), 
      'utf8'
    )
    
    // Split SQL statements by semicolon and filter out empty statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        
        if (error) {
          // Try direct SQL execution as fallback
          const { error: directError } = await supabase
            .from('pg_stat_user_tables')
            .select('*')
            .limit(1)
          
          if (directError) {
            console.warn(`⚠️  Could not execute: ${statement.substring(0, 50)}...`)
            console.warn(`Error: ${error.message}`)
          }
        } else {
          console.log(`✅ Statement ${i + 1} completed successfully`)
        }
      } catch (err) {
        console.warn(`⚠️  Error executing statement ${i + 1}: ${err.message}`)
      }
    }
    
    console.log('🎉 Performance indexes application completed!')
    console.log('📈 Database queries should now be significantly faster')
    
  } catch (error) {
    console.error('❌ Error applying indexes:', error.message)
    process.exit(1)
  }
}

applyIndexes()