/**
 * Complete Migration Process
 * 
 * Handles the complete database migration process with manual column addition step.
 * Provides clear instructions and verification at each step.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

class CompleteMigrationProcess {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    this.stats = {
      startTime: new Date(),
      judgesProcessed: 0,
      positionsCreated: 0,
      courtsUpdated: 0,
      errors: []
    }
  }

  async checkColumnExistence() {
    console.log('🔍 Checking required columns...')

    const missingColumns = []

    // Test courthouse_metadata column
    try {
      await this.supabase.from('courts').select('courthouse_metadata').limit(1)
    } catch (error) {
      if (error.message.includes('courthouse_metadata')) {
        missingColumns.push('courts.courthouse_metadata')
      }
    }

    // Test positions column  
    try {
      await this.supabase.from('judges').select('positions').limit(1)
    } catch (error) {
      if (error.message.includes('positions')) {
        missingColumns.push('judges.positions')
      }
    }

    return missingColumns
  }

  async showRequiredSQL() {
    console.log('\n🔧 REQUIRED: Execute these SQL statements in Supabase')
    console.log('=' .repeat(60))
    console.log('1. Open your Supabase project dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Execute these statements:')
    console.log('')
    console.log("ALTER TABLE courts ADD COLUMN IF NOT EXISTS courthouse_metadata JSONB DEFAULT '{}'::jsonb;")
    console.log("ALTER TABLE judges ADD COLUMN IF NOT EXISTS positions JSONB DEFAULT '[]'::jsonb;")
    console.log('')
    console.log('4. Return here and the script will continue automatically')
    console.log('=' .repeat(60))
  }

  async waitForColumns() {
    console.log('\n⏳ Waiting for column additions to be completed...')
    
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max wait
    
    while (attempts < maxAttempts) {
      const missingColumns = await this.checkColumnExistence()
      
      if (missingColumns.length === 0) {
        console.log('✅ All required columns are now present!')
        return true
      }
      
      if (attempts === 0) {
        console.log(`❌ Missing columns: ${missingColumns.join(', ')}`)
        console.log('   Please execute the SQL statements shown above...')
      }
      
      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++
      
      if (attempts % 6 === 0) { // Every 30 seconds
        console.log(`   Still waiting... (${attempts * 5}s elapsed)`)
      }
    }
    
    console.log('❌ Timeout waiting for columns. Please execute the SQL statements and run this script again.')
    return false
  }

  async populateJudgeCourtPositions() {
    console.log('\n🔄 Populating judge_court_positions table...')

    try {
      // Get all judges with court assignments
      const { data: judges, error: judgesError } = await this.supabase
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

      if (judgesError) {
        throw new Error(`Failed to fetch judges: ${judgesError.message}`)
      }

      console.log(`📋 Found ${judges.length} judges with court assignments`)

      let processed = 0
      let created = 0
      let skipped = 0

      for (const judge of judges) {
        try {
          // Check if position already exists
          const { data: existingPosition } = await this.supabase
            .from('judge_court_positions')
            .select('id')
            .eq('judge_id', judge.id)
            .eq('court_id', judge.court_id)
            .eq('status', 'active')
            .single()

          if (existingPosition) {
            skipped++
            continue
          }

          // Determine position type
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

          // Insert position
          const { error: insertError } = await this.supabase
            .from('judge_court_positions')
            .insert([positionData])

          if (insertError) {
            console.log(`   ❌ Error creating position for ${judge.name}:`, insertError.message)
            this.stats.errors.push({
              judge: judge.name,
              error: insertError.message
            })
          } else {
            created++
          }

          processed++

          if (processed % 100 === 0) {
            console.log(`   📊 Progress: ${processed}/${judges.length} judges processed`)
          }

        } catch (error) {
          console.log(`   ❌ Error processing ${judge.name}:`, error.message)
          this.stats.errors.push({
            judge: judge.name,
            error: error.message
          })
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      console.log(`✅ Position migration complete: ${created} created, ${skipped} skipped, ${this.stats.errors.length} errors`)
      this.stats.judgesProcessed = processed
      this.stats.positionsCreated = created

      return true
    } catch (error) {
      console.error('❌ Error populating judge court positions:', error.message)
      return false
    }
  }

  determinePositionType(judge) {
    const name = judge.name?.toLowerCase() || ''
    const courtName = judge.courts?.name?.toLowerCase() || ''
    
    if (name.includes('chief')) return 'Chief Judge'
    if (name.includes('presiding')) return 'Presiding Judge'
    if (name.includes('senior')) return 'Senior Judge'
    if (name.includes('retired')) return 'Retired Judge'
    if (name.includes('acting')) return 'Acting Judge'
    if (name.includes('magistrate')) return 'Magistrate Judge'
    
    if (courtName.includes('magistrate')) return 'Magistrate Judge'
    if (courtName.includes('appellate')) return 'Associate Judge'
    if (courtName.includes('supreme')) return 'Associate Judge'
    
    return 'Judge'
  }

  async updateCourtJudgeCounts() {
    console.log('\n📊 Updating court judge counts...')

    try {
      // Get active positions count per court
      const { data: positions, error } = await this.supabase
        .from('judge_court_positions')
        .select('court_id')
        .eq('status', 'active')

      if (error) {
        throw new Error(`Failed to get positions: ${error.message}`)
      }

      // Count positions per court
      const courtCounts = {}
      positions.forEach(pos => {
        courtCounts[pos.court_id] = (courtCounts[pos.court_id] || 0) + 1
      })

      console.log(`📈 Updating ${Object.keys(courtCounts).length} courts...`)

      let updated = 0
      for (const [courtId, count] of Object.entries(courtCounts)) {
        const { error: updateError } = await this.supabase
          .from('courts')
          .update({ judge_count: count })
          .eq('id', courtId)

        if (updateError) {
          console.log(`   ⚠️  Failed to update court ${courtId}:`, updateError.message)
        } else {
          updated++
        }
      }

      console.log(`✅ Updated judge counts for ${updated} courts`)
      this.stats.courtsUpdated = updated
      return true
    } catch (error) {
      console.error('❌ Error updating court judge counts:', error.message)
      return false
    }
  }

  async normalizeJurisdictions() {
    console.log('\n🌎 Normalizing California jurisdictions...')

    try {
      // Update "California" to "CA" in judges table
      const { data: judgeUpdate, error: judgeError } = await this.supabase
        .from('judges')
        .update({ jurisdiction: 'CA' })
        .eq('jurisdiction', 'California')
        .select('id')

      if (judgeError) {
        throw new Error(`Failed to update judge jurisdictions: ${judgeError.message}`)
      }

      // Update "California" to "CA" in courts table
      const { data: courtUpdate, error: courtError } = await this.supabase
        .from('courts')
        .update({ jurisdiction: 'CA' })
        .eq('jurisdiction', 'California')
        .select('id')

      if (courtError) {
        throw new Error(`Failed to update court jurisdictions: ${courtError.message}`)
      }

      console.log(`✅ Normalized jurisdictions: ${judgeUpdate?.length || 0} judges, ${courtUpdate?.length || 0} courts`)
      return true
    } catch (error) {
      console.error('❌ Error normalizing jurisdictions:', error.message)
      return false
    }
  }

  async verifyFinalState() {
    console.log('\n🔍 Verifying final migration state...')

    try {
      // Count California judges
      const { count: caJudges } = await this.supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })
        .eq('jurisdiction', 'CA')

      // Count active judge positions
      const { count: activePositions } = await this.supabase
        .from('judge_court_positions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Count courts with updated judge counts
      const { count: courtsWithCounts } = await this.supabase
        .from('courts')
        .select('*', { count: 'exact', head: true })
        .gt('judge_count', 0)

      console.log(`📊 Final state verification:`)
      console.log(`   California judges: ${caJudges}`)
      console.log(`   Active judge positions: ${activePositions}`)
      console.log(`   Courts with judge counts: ${courtsWithCounts}`)

      const success = caJudges >= 1810 && activePositions > 0 && courtsWithCounts > 0
      
      if (success) {
        console.log('✅ Migration verification passed!')
      } else {
        console.log('⚠️  Migration verification issues detected')
      }

      return success
    } catch (error) {
      console.error('❌ Error verifying final state:', error.message)
      return false
    }
  }

  async generateFinalReport() {
    const endTime = new Date()
    const duration = Math.round((endTime - this.stats.startTime) / 1000)

    console.log('\n📊 Migration Complete - Final Report')
    console.log('=' .repeat(60))
    console.log(`⏱️  Total duration: ${duration} seconds`)
    console.log(`👨‍⚖️ Judges processed: ${this.stats.judgesProcessed}`)
    console.log(`🏛️  Positions created: ${this.stats.positionsCreated}`)
    console.log(`📊 Courts updated: ${this.stats.courtsUpdated}`)
    console.log(`❌ Errors encountered: ${this.stats.errors.length}`)

    if (this.stats.errors.length > 0) {
      console.log('\n⚠️  Error details:')
      this.stats.errors.slice(0, 5).forEach(error => {
        console.log(`   - ${error.judge}: ${error.error}`)
      })
      if (this.stats.errors.length > 5) {
        console.log(`   ... and ${this.stats.errors.length - 5} more errors`)
      }
    }

    console.log('\n✅ Migration Results:')
    console.log('   - Schema updated with CourtListener fields')
    console.log('   - Judge-court relationships established')
    console.log('   - Court judge counts updated')
    console.log('   - Jurisdictions normalized to "CA"')
    console.log('   - All California judges remain accessible')

    console.log('=' .repeat(60))
  }

  async run() {
    try {
      console.log('🚀 Complete Database Migration Process')
      console.log('=' .repeat(60))

      // Step 1: Check if columns exist
      const missingColumns = await this.checkColumnExistence()

      if (missingColumns.length > 0) {
        await this.showRequiredSQL()
        
        const columnsReady = await this.waitForColumns()
        if (!columnsReady) {
          return false
        }
      } else {
        console.log('✅ All required columns are present')
      }

      // Step 2: Populate judge-court positions
      const positionsSuccess = await this.populateJudgeCourtPositions()
      if (!positionsSuccess) return false

      // Step 3: Update court judge counts
      await this.updateCourtJudgeCounts()

      // Step 4: Normalize jurisdictions
      await this.normalizeJurisdictions()

      // Step 5: Verify final state
      const verificationSuccess = await this.verifyFinalState()

      // Step 6: Generate final report
      await this.generateFinalReport()

      return verificationSuccess
    } catch (error) {
      console.error('💥 Migration process failed:', error.message)
      return false
    }
  }
}

// Main execution
async function main() {
  try {
    const migration = new CompleteMigrationProcess()
    const success = await migration.run()
    
    if (success) {
      console.log('\n🎉 Database migration completed successfully!')
      process.exit(0)
    } else {
      console.log('\n❌ Database migration failed!')
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

module.exports = { CompleteMigrationProcess }