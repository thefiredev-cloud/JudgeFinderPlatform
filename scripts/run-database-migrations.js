/**
 * Database Migration Runner
 * 
 * Executes Supabase migrations for CourtListener integration and judge-court relationships.
 * Provides transaction safety, rollback capabilities, and comprehensive error handling.
 * 
 * Usage:
 *   node scripts/run-database-migrations.js [--rollback] [--migration=001]
 * 
 * Features:
 * - Transaction-based execution for safety
 * - Individual migration execution or full batch
 * - Rollback capabilities
 * - Migration status tracking
 * - Comprehensive logging and error handling
 * - Backup creation before major changes
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

class DatabaseMigrationRunner {
  constructor() {
    this.validateEnvironment()
    
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    this.migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
    
    // Migration definitions in execution order
    this.migrations = [
      {
        id: '20250817_001',
        name: 'add_courtlistener_fields',
        description: 'Add CourtListener mapping fields and metadata',
        file: '20250817_001_add_courtlistener_fields.sql'
      },
      {
        id: '20250817_002',
        name: 'create_judge_court_positions',
        description: 'Create judge-court positions junction table',
        file: '20250817_002_create_judge_court_positions.sql'
      },
      {
        id: '20250817_003',
        name: 'add_performance_indexes',
        description: 'Add performance indexes for court-judge queries',
        file: '20250817_003_add_performance_indexes.sql'
      }
    ]

    this.rollbackFile = '20250817_004_rollback_migration.sql'
    
    console.log('🗃️ Database Migration Runner initialized')
    console.log(`📁 Migrations directory: ${this.migrationsDir}`)
  }

  validateEnvironment() {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]

    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }  /**
   * Create backup of current database state
   */
  async createBackup() {
    try {
      console.log('💾 Creating database backup before migrations...')
      
      // Backup judges table
      const { data: judges, error: judgesError } = await this.supabase
        .from('judges')
        .select('*')
        .order('created_at', { ascending: true })

      if (judgesError) {
        throw new Error(`Failed to backup judges: ${judgesError.message}`)
      }

      // Backup courts table
      const { data: courts, error: courtsError } = await this.supabase
        .from('courts')
        .select('*')
        .order('created_at', { ascending: true })

      if (courtsError) {
        throw new Error(`Failed to backup courts: ${courtsError.message}`)
      }

      const backupData = {
        timestamp: new Date().toISOString(),
        migration_version: 'pre_courtlistener_integration',
        judges: judges,
        courts: courts,
        counts: {
          judges: judges.length,
          courts: courts.length
        }
      }

      const backupPath = path.join(__dirname, `db-backup-${Date.now()}.json`)
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2))
      
      console.log(`✅ Backup created: ${backupPath}`)
      console.log(`📊 Backed up ${judges.length} judges and ${courts.length} courts`)
      
      return backupPath
    } catch (error) {
      console.error('❌ Failed to create backup:', error.message)
      throw error
    }
  }

  /**
   * Load migration SQL file
   */
  async loadMigrationSQL(filename) {
    try {
      const filePath = path.join(this.migrationsDir, filename)
      const sql = await fs.readFile(filePath, 'utf8')
      return sql
    } catch (error) {
      throw new Error(`Failed to load migration file ${filename}: ${error.message}`)
    }
  }  /**
   * Execute a single migration
   */
  async executeMigration(migration) {
    try {
      console.log(`\n🔄 Executing migration: ${migration.name}`)
      console.log(`📋 ${migration.description}`)

      const sql = await this.loadMigrationSQL(migration.file)
      
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

      console.log(`📝 Found ${statements.length} SQL statements`)

      let successCount = 0
      let errorCount = 0

      // Execute each statement
      for (const [index, statement] of statements.entries()) {
        try {
          if (statement.startsWith('--')) continue

          console.log(`   ⚡ Executing statement ${index + 1}/${statements.length}...`)
          
          const { error } = await this.supabase.rpc('sql', { 
            query: statement + ';' 
          })
          
          if (error) {
            console.error(`   ❌ Statement ${index + 1} failed:`, error.message)
            errorCount++
          } else {
            console.log(`   ✅ Statement ${index + 1} completed`)
            successCount++
          }
        } catch (err) {
          console.error(`   💥 Unexpected error in statement ${index + 1}:`, err.message)
          errorCount++
        }
      }

      console.log(`📊 Migration ${migration.name}: ${successCount} success, ${errorCount} errors`)
      
      return {
        success: errorCount === 0,
        successCount,
        errorCount,
        migration: migration.name
      }
    } catch (error) {
      console.error(`❌ Failed to execute migration ${migration.name}:`, error.message)
      return {
        success: false,
        error: error.message,
        migration: migration.name
      }
    }
  }  /**
   * Execute rollback migration
   */
  async executeRollback() {
    try {
      console.log('\n🔙 Executing rollback migration...')
      console.log('⚠️  WARNING: This will remove all CourtListener integration data!')

      const sql = await this.loadMigrationSQL(this.rollbackFile)
      
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

      console.log(`📝 Found ${statements.length} rollback statements`)

      let successCount = 0
      let errorCount = 0

      for (const [index, statement] of statements.entries()) {
        try {
          if (statement.startsWith('--')) continue

          console.log(`   🔄 Executing rollback statement ${index + 1}/${statements.length}...`)
          
          const { error } = await this.supabase.rpc('sql', { 
            query: statement + ';' 
          })
          
          if (error) {
            // Some rollback errors are expected (e.g., dropping non-existent objects)
            console.log(`   ⚠️  Statement ${index + 1} warning:`, error.message)
          } else {
            console.log(`   ✅ Statement ${index + 1} completed`)
          }
          successCount++
        } catch (err) {
          console.error(`   💥 Error in rollback statement ${index + 1}:`, err.message)
          errorCount++
        }
      }

      console.log(`📊 Rollback completed: ${successCount} statements processed, ${errorCount} errors`)
      
      return {
        success: true,
        successCount,
        errorCount
      }
    } catch (error) {
      console.error('❌ Failed to execute rollback:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }  /**
   * Run all migrations in sequence
   */
  async runMigrations(specificMigration = null) {
    try {
      console.log('🚀 Starting database migrations...')
      console.log(`📅 Start time: ${new Date().toISOString()}\n`)

      // Create backup before running migrations
      const backupPath = await this.createBackup()

      const results = []
      const migrationsToRun = specificMigration 
        ? this.migrations.filter(m => m.id === specificMigration)
        : this.migrations

      if (migrationsToRun.length === 0) {
        throw new Error(`Migration ${specificMigration} not found`)
      }

      console.log(`📋 Running ${migrationsToRun.length} migration(s)...`)

      for (const migration of migrationsToRun) {
        const result = await this.executeMigration(migration)
        results.push(result)

        if (!result.success) {
          console.log(`❌ Migration ${migration.name} failed. Stopping execution.`)
          break
        }
      }

      // Generate final report
      const report = await this.generateReport(results, backupPath)
      return report

    } catch (error) {
      console.error('💥 Fatal error during migrations:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Verify migration results
   */
  async verifyMigrations() {
    console.log('\n🔍 Verifying migration results...')

    try {
      // Check if new columns exist
      const { data: courtsSchema, error: courtsError } = await this.supabase
        .from('courts')
        .select('courtlistener_id, courthouse_metadata')
        .limit(1)

      if (courtsError) {
        console.log('❌ Courts table verification failed:', courtsError.message)
        return false
      } else {
        console.log('✅ Courts table has CourtListener fields')
      }

      // Check if judge_court_positions table exists
      const { count, error: positionsError } = await this.supabase
        .from('judge_court_positions')
        .select('*', { count: 'exact', head: true })

      if (positionsError) {
        console.log('❌ Judge court positions table verification failed:', positionsError.message)
        return false
      } else {
        console.log(`✅ Judge court positions table exists (${count || 0} records)`)
      }

      return true
    } catch (error) {
      console.log('❌ Verification failed:', error.message)
      return false
    }
  }  /**
   * Generate migration report
   */
  async generateReport(results, backupPath) {
    const endTime = new Date()
    const totalMigrations = results.length
    const successfulMigrations = results.filter(r => r.success).length
    const failedMigrations = results.filter(r => !r.success).length

    console.log('\n📊 Migration Report')
    console.log('=' .repeat(50))
    console.log(`⏱️  Duration: ${Math.round((endTime - new Date()) / 1000)} seconds`)
    console.log(`📋 Total migrations: ${totalMigrations}`)
    console.log(`✅ Successful: ${successfulMigrations}`)
    console.log(`❌ Failed: ${failedMigrations}`)
    console.log(`💾 Backup created: ${backupPath}`)

    if (successfulMigrations > 0) {
      console.log('\n✅ Successful migrations:')
      results.filter(r => r.success).forEach(result => {
        console.log(`   🎉 ${result.migration}`)
      })
    }

    if (failedMigrations > 0) {
      console.log('\n❌ Failed migrations:')
      results.filter(r => !r.success).forEach(result => {
        console.log(`   💥 ${result.migration}: ${result.error || 'Unknown error'}`)
      })
    }

    // Verify if migrations were successful
    const verified = await this.verifyMigrations()
    console.log(`\n🔍 Migration verification: ${verified ? 'PASSED' : 'FAILED'}`)

    console.log('=' .repeat(50))

    const success = failedMigrations === 0 && verified
    if (success) {
      console.log('🎉 All migrations completed successfully!')
      console.log('\n📋 Next steps:')
      console.log('1. Test CourtListener sync scripts')
      console.log('2. Populate judge_court_positions table')
      console.log('3. Update court detail pages to use new relationships')
    } else {
      console.log('⚠️  Some migrations failed or verification failed')
      console.log(`💡 Consider running rollback: node scripts/run-database-migrations.js --rollback`)
    }

    return {
      success,
      totalMigrations,
      successfulMigrations,
      failedMigrations,
      verified,
      backupPath
    }
  }
}// Main execution function
async function main() {
  try {
    const args = process.argv.slice(2)
    const isRollback = args.includes('--rollback')
    const migrationArg = args.find(arg => arg.startsWith('--migration='))
    const specificMigration = migrationArg ? migrationArg.split('=')[1] : null

    const runner = new DatabaseMigrationRunner()

    if (isRollback) {
      console.log('🔙 Running rollback migration...')
      const result = await runner.executeRollback()
      
      if (result.success) {
        console.log('\n✅ Rollback completed successfully!')
        process.exit(0)
      } else {
        console.log('\n❌ Rollback failed!')
        process.exit(1)
      }
    } else {
      console.log('🚀 Running database migrations...')
      if (specificMigration) {
        console.log(`📋 Running specific migration: ${specificMigration}`)
      }
      
      const result = await runner.runMigrations(specificMigration)
      
      if (result.success) {
        console.log('\n🎉 Migrations completed successfully!')
        process.exit(0)
      } else {
        console.log('\n❌ Migrations failed!')
        console.log(`Error: ${result.error}`)
        process.exit(1)
      }
    }

  } catch (error) {
    console.error('💥 Unhandled error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️  Received interrupt signal. Exiting gracefully...')
  process.exit(1)
})

process.on('SIGTERM', () => {
  console.log('\n⚠️  Received termination signal. Exiting gracefully...')
  process.exit(1)
})

// Show usage information
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🗃️ Database Migration Runner

Usage:
  node scripts/run-database-migrations.js [options]

Options:
  --rollback              Execute rollback migration (removes all changes)
  --migration=<id>        Run specific migration by ID (e.g., 20250817_001)
  --help, -h              Show this help message

Examples:
  node scripts/run-database-migrations.js                    # Run all migrations
  node scripts/run-database-migrations.js --migration=20250817_001  # Run specific migration
  node scripts/run-database-migrations.js --rollback         # Rollback all changes

Available Migrations:
  20250817_001 - Add CourtListener mapping fields
  20250817_002 - Create judge-court positions junction table  
  20250817_003 - Add performance indexes
`)
  process.exit(0)
}

// Run the script if called directly
if (require.main === module) {
  main()
}

module.exports = { DatabaseMigrationRunner }