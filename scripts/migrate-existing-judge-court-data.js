/**
 * Migrate Existing Judge-Court Data
 * 
 * Populates the new judge_court_positions table with existing court assignments
 * from the current judges.court_id relationships.
 * 
 * Features:
 * - Migrates existing judge-court relationships
 * - Creates position records with metadata
 * - Handles data validation and error recovery
 * - Provides comprehensive logging and statistics
 * - Safe execution with transaction support
 * 
 * Usage:
 *   node scripts/migrate-existing-judge-court-data.js [--dry-run]
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

class JudgeCourtDataMigrator {
  constructor() {
    this.validateEnvironment()
    
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Statistics tracking
    this.stats = {
      judgesProcessed: 0,
      positionsCreated: 0,
      skippedJudges: 0,
      errors: 0,
      startTime: new Date()
    }

    console.log('🔄 Judge-Court Data Migrator initialized')
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
  }

  /**
   * Get all judges with existing court assignments
   */
  async getJudgesWithCourtAssignments() {
    try {
      console.log('📋 Fetching judges with court assignments...')

      const { data: judges, error } = await this.supabase
        .from('judges')
        .select(`
          id,
          name,
          court_id,
          jurisdiction,
          created_at,
          courts:court_id (
            id,
            name,
            type,
            jurisdiction
          )
        `)
        .not('court_id', 'is', null)
        .order('created_at', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch judges: ${error.message}`)
      }

      console.log(`✅ Found ${judges.length} judges with court assignments`)
      return judges
    } catch (error) {
      console.error('❌ Error fetching judges:', error.message)
      throw error
    }
  }  /**
   * Create judge court position record
   */
  async createJudgeCourtPosition(judge, dryRun = false) {
    try {
      // Determine position type based on judge name or court type
      const positionType = this.determinePositionType(judge)
      
      // Create position metadata
      const metadata = {
        migration_source: 'existing_court_assignment',
        original_court_id: judge.court_id,
        judge_name: judge.name,
        court_name: judge.courts?.name,
        court_type: judge.courts?.type,
        migration_date: new Date().toISOString(),
        jurisdiction: judge.jurisdiction
      }

      const positionData = {
        judge_id: judge.id,
        court_id: judge.court_id,
        position_type: positionType,
        start_date: judge.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        status: 'active',
        metadata: metadata
      }

      if (dryRun) {
        console.log(`   [DRY RUN] Would create position: ${judge.name} -> ${judge.courts?.name} (${positionType})`)
        return { success: true, dryRun: true }
      }

      // Insert the position record
      const { data, error } = await this.supabase
        .from('judge_court_positions')
        .insert([positionData])
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create position: ${error.message}`)
      }

      console.log(`   ✅ Created position: ${judge.name} -> ${judge.courts?.name} (${positionType})`)
      this.stats.positionsCreated++
      
      return { success: true, data }
    } catch (error) {
      console.error(`   ❌ Error creating position for ${judge.name}:`, error.message)
      this.stats.errors++
      return { success: false, error: error.message }
    }
  }

  /**
   * Determine position type based on judge/court information
   */
  determinePositionType(judge) {
    const name = judge.name?.toLowerCase() || ''
    const courtName = judge.courts?.name?.toLowerCase() || ''
    
    // Check for specific position indicators in judge name
    if (name.includes('chief')) return 'Chief Judge'
    if (name.includes('presiding')) return 'Presiding Judge'
    if (name.includes('senior')) return 'Senior Judge'
    if (name.includes('retired')) return 'Retired Judge'
    if (name.includes('acting')) return 'Acting Judge'
    if (name.includes('magistrate')) return 'Magistrate Judge'
    
    // Check court type for position hints
    if (courtName.includes('magistrate')) return 'Magistrate Judge'
    if (courtName.includes('municipal')) return 'Judge'
    if (courtName.includes('superior')) return 'Judge'
    if (courtName.includes('appellate')) return 'Associate Judge'
    if (courtName.includes('supreme')) return 'Associate Judge'
    
    // Default position type
    return 'Judge'
  }  /**
   * Run the migration process
   */
  async runMigration(dryRun = false) {
    try {
      console.log(`🚀 Starting judge-court data migration${dryRun ? ' (DRY RUN)' : ''}...`)
      console.log(`📅 Start time: ${this.stats.startTime.toISOString()}\n`)

      // Get judges with court assignments
      const judges = await this.getJudgesWithCourtAssignments()

      if (judges.length === 0) {
        console.log('⚠️  No judges with court assignments found. Nothing to migrate.')
        return { success: true, reason: 'No data to migrate' }
      }

      // Check if judge_court_positions table exists
      const { error: tableError } = await this.supabase
        .from('judge_court_positions')
        .select('id')
        .limit(1)

      if (tableError) {
        throw new Error(`judge_court_positions table not found. Run database migrations first: ${tableError.message}`)
      }

      console.log(`📋 Processing ${judges.length} judges...`)

      // Process each judge
      for (let i = 0; i < judges.length; i++) {
        const judge = judges[i]
        const progress = `[${i + 1}/${judges.length}]`

        console.log(`${progress} Processing: ${judge.name}`)

        try {
          // Check if position already exists
          if (!dryRun) {
            const { data: existingPosition, error: checkError } = await this.supabase
              .from('judge_court_positions')
              .select('id')
              .eq('judge_id', judge.id)
              .eq('court_id', judge.court_id)
              .eq('status', 'active')
              .single()

            if (!checkError && existingPosition) {
              console.log(`   ⏭️  Position already exists, skipping`)
              this.stats.skippedJudges++
              continue
            }
          }

          // Create the position record
          await this.createJudgeCourtPosition(judge, dryRun)
          this.stats.judgesProcessed++

        } catch (error) {
          console.error(`   ❌ Error processing ${judge.name}:`, error.message)
          this.stats.errors++
          this.stats.skippedJudges++
        }

        // Rate limiting
        if (i < judges.length - 1) {
          await this.sleep(100) // 100ms between operations
        }
      }

      // Generate final report
      const report = await this.generateReport(dryRun)
      return report

    } catch (error) {
      console.error('💥 Fatal error during migration:', error.message)
      return {
        success: false,
        error: error.message,
        stats: this.stats
      }
    }
  }  /**
   * Generate migration report
   */
  async generateReport(dryRun = false) {
    const endTime = new Date()
    const duration = Math.round((endTime - this.stats.startTime) / 1000)

    console.log(`\n📊 Judge-Court Data Migration Report${dryRun ? ' (DRY RUN)' : ''}`)
    console.log('=' .repeat(60))
    console.log(`⏱️  Duration: ${duration} seconds`)
    console.log(`👨‍⚖️ Judges processed: ${this.stats.judgesProcessed}`)
    console.log(`🏛️  Positions created: ${this.stats.positionsCreated}`)
    console.log(`⏭️  Judges skipped: ${this.stats.skippedJudges}`)
    console.log(`❌ Errors encountered: ${this.stats.errors}`)

    if (!dryRun) {
      // Get final statistics from database
      try {
        const { count: totalPositions, error } = await this.supabase
          .from('judge_court_positions')
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.log(`❌ Could not fetch final position count: ${error.message}`)
        } else {
          console.log(`📊 Total positions in database: ${totalPositions}`)
        }

        // Get active positions count
        const { count: activePositions, error: activeError } = await this.supabase
          .from('judge_court_positions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        if (activeError) {
          console.log(`❌ Could not fetch active position count: ${activeError.message}`)
        } else {
          console.log(`✅ Active positions: ${activePositions}`)
        }

      } catch (error) {
        console.log(`❌ Error generating database statistics: ${error.message}`)
      }
    }

    console.log('=' .repeat(60))

    const success = this.stats.errors === 0
    if (dryRun) {
      console.log('🔍 Dry run completed successfully!')
      console.log('💡 Run without --dry-run to execute the migration')
    } else if (success) {
      console.log('✅ Migration completed successfully!')
      console.log('\n📋 Next steps:')
      console.log('1. Verify position data in judge_court_positions table')
      console.log('2. Update court detail pages to use new relationships')
      console.log('3. Run CourtListener sync to enrich position data')
    } else {
      console.log(`⚠️  Migration completed with ${this.stats.errors} errors`)
      console.log('💡 Check error messages above for details')
    }

    return {
      success,
      stats: this.stats,
      duration,
      dryRun
    }
  }

  /**
   * Sleep utility for rate limiting
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}// Main execution function
async function main() {
  try {
    const args = process.argv.slice(2)
    const isDryRun = args.includes('--dry-run')

    const migrator = new JudgeCourtDataMigrator()
    
    if (isDryRun) {
      console.log('🔍 Running in DRY RUN mode - no data will be modified')
    }
    
    const result = await migrator.runMigration(isDryRun)
    
    if (result.success) {
      console.log('\n🎉 Judge-court data migration completed successfully!')
      process.exit(0)
    } else {
      console.log('\n❌ Judge-court data migration failed!')
      console.log(`Error: ${result.error}`)
      process.exit(1)
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
🔄 Judge-Court Data Migrator

Migrates existing judge-court assignments from the judges.court_id field
to the new judge_court_positions table structure.

Usage:
  node scripts/migrate-existing-judge-court-data.js [options]

Options:
  --dry-run               Run migration preview without making changes
  --help, -h              Show this help message

Examples:
  node scripts/migrate-existing-judge-court-data.js --dry-run     # Preview migration
  node scripts/migrate-existing-judge-court-data.js              # Execute migration

Prerequisites:
  1. Run database migrations first: node scripts/run-database-migrations.js
  2. Ensure judge_court_positions table exists
  3. Have judges with valid court_id assignments
`)
  process.exit(0)
}

// Run the script if called directly
if (require.main === module) {
  main()
}

module.exports = { JudgeCourtDataMigrator }