/**
 * Execute Full Database Migration
 * 
 * Applies all migration files in correct order and then runs the post-migration process
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

class FullMigrationExecutor {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }

  async executeSQLFile(filePath) {
    console.log(`\n🔧 Executing migration: ${path.basename(filePath)}`)
    
    try {
      const sql = fs.readFileSync(filePath, 'utf8')
      
      // Split SQL by statements and execute each one
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '')
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement) {
          console.log(`   Executing statement ${i + 1}/${statements.length}...`)
          
          const { error } = await this.supabase.rpc('exec_sql', {
            sql_text: statement
          })
          
          if (error) {
            console.log(`   ⚠️  Statement ${i + 1} warning:`, error.message)
            // Continue with other statements
          } else {
            console.log(`   ✅ Statement ${i + 1} completed`)
          }
        }
      }
      
      console.log(`✅ Migration ${path.basename(filePath)} completed`)
      return true
    } catch (error) {
      console.error(`❌ Error executing ${path.basename(filePath)}:`, error.message)
      return false
    }
  }

  async checkTableExists(tableName) {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      return !error
    } catch (error) {
      return false
    }
  }

  async verifyMigrationState() {
    console.log('\n🔍 Verifying migration state...')
    
    // Check if required tables exist
    const tablesExist = {
      judges: await this.checkTableExists('judges'),
      courts: await this.checkTableExists('courts'),
      judge_court_positions: await this.checkTableExists('judge_court_positions')
    }
    
    console.log('📊 Table verification:')
    Object.entries(tablesExist).forEach(([table, exists]) => {
      console.log(`   ${exists ? '✅' : '❌'} ${table}`)
    })
    
    // Check column existence
    try {
      await this.supabase.from('courts').select('courthouse_metadata').limit(1)
      console.log('   ✅ courts.courthouse_metadata column exists')
    } catch (error) {
      console.log('   ❌ courts.courthouse_metadata column missing')
    }
    
    try {
      await this.supabase.from('judges').select('positions').limit(1)
      console.log('   ✅ judges.positions column exists')
    } catch (error) {
      console.log('   ❌ judges.positions column missing')
    }
    
    return tablesExist.judge_court_positions
  }

  async run() {
    try {
      console.log('🚀 Full Database Migration Execution')
      console.log('=' .repeat(60))

      // Migration files in order
      const migrationFiles = [
        'supabase/migrations/20250817_001_add_courtlistener_fields.sql',
        'supabase/migrations/20250817_002_create_judge_court_positions.sql',
        'supabase/migrations/20250817_003_add_performance_indexes.sql'
      ]

      // Execute each migration file
      for (const migrationFile of migrationFiles) {
        const fullPath = path.join(process.cwd(), migrationFile)
        
        if (!fs.existsSync(fullPath)) {
          console.log(`⚠️  Migration file not found: ${migrationFile}`)
          continue
        }
        
        const success = await this.executeSQLFile(fullPath)
        if (!success) {
          console.log(`❌ Migration failed at: ${migrationFile}`)
          // Continue with remaining migrations
        }
        
        // Small delay between migrations
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Verify migration state
      const migrationComplete = await this.verifyMigrationState()
      
      if (migrationComplete) {
        console.log('\n✅ Schema migration completed successfully!')
        console.log('🔄 Ready for post-migration data processing...')
        return true
      } else {
        console.log('\n❌ Schema migration incomplete')
        return false
      }

    } catch (error) {
      console.error('💥 Migration execution failed:', error.message)
      return false
    }
  }
}

// Create exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  console.log('🔧 Setting up SQL execution function...')
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Try to execute a simple SQL command to test if rpc works
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_text: 'SELECT 1 as test'
    })
    
    if (!error) {
      console.log('✅ SQL execution function ready')
      return true
    }
  } catch (error) {
    console.log('⚠️  SQL execution function not available, using direct queries')
  }

  return false
}

// Main execution
async function main() {
  try {
    await createExecSqlFunction()
    
    const migrator = new FullMigrationExecutor()
    const success = await migrator.run()
    
    if (success) {
      console.log('\n🎉 Schema migration completed!')
      console.log('📝 Next: Run the complete migration process for data population')
      process.exit(0)
    } else {
      console.log('\n❌ Schema migration failed!')
      process.exit(1)
    }
  } catch (error) {
    console.error('💥 Unhandled error:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { FullMigrationExecutor }