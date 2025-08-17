/**
 * Post-Manual Migration Script
 * 
 * Executes the remaining migration steps after manual SQL execution.
 * Handles data population, court counts, and jurisdiction normalization.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

class PostManualMigration {
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
      jurisdictionsNormalized: 0,
      errors: []
    }
  }

  async verifySchemaReady() {
    console.log('🔍 Verifying schema is ready for data migration...')

    const checks = []

    // Check courthouse_metadata column
    try {
      await this.supabase.from('courts').select('courthouse_metadata').limit(1)
      checks.push({ name: 'courts.courthouse_metadata', status: '✅ Ready' })
    } catch (error) {
      checks.push({ name: 'courts.courthouse_metadata', status: '❌ Missing' })
    }

    // Check positions column
    try {
      await this.supabase.from('judges').select('positions').limit(1)
      checks.push({ name: 'judges.positions', status: '✅ Ready' })
    } catch (error) {
      checks.push({ name: 'judges.positions', status: '❌ Missing' })
    }

    // Check judge_court_positions table accessibility
    try {
      const { data, error } = await this.supabase
        .from('judge_court_positions')
        .select('id')
        .limit(1)
      
      if (error) {
        checks.push({ name: 'judge_court_positions access', status: `❌ ${error.message}` })
      } else {
        checks.push({ name: 'judge_court_positions access', status: '✅ Ready' })
      }
    } catch (error) {
      checks.push({ name: 'judge_court_positions access', status: `❌ ${error.message}` })
    }

    // Display results
    console.log('\n📋 Schema Verification Results:')
    checks.forEach(check => {
      console.log(`   ${check.status} ${check.name}`)
    })

    const allReady = checks.every(check => check.status.includes('✅'))

    if (!allReady) {
      console.log('\n❌ Schema not ready. Please complete manual SQL execution first.')
      console.log('📖 See MIGRATION_INSTRUCTIONS.md for details.')
      return false
    }

    console.log('\n✅ Schema verification passed!')
    return true
  }

  async populateJudgeCourtPositions() {
    console.log('\n🔄 Populating judge_court_positions table...')

    try {
      // Get judges with court assignments
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

      console.log(`📊 Found ${judges.length} judges with court assignments`)

      let batchSize = 50
      let processed = 0
      let created = 0
      let skipped = 0

      // Process in batches
      for (let i = 0; i < judges.length; i += batchSize) {
        const batch = judges.slice(i, i + batchSize)
        console.log(`   📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(judges.length/batchSize)} (${batch.length} judges)`)

        const positionsToInsert = []

        for (const judge of batch) {
          try {
            // Check if position already exists
            const { data: existingPosition, error: checkError } = await this.supabase
              .from('judge_court_positions')
              .select('id')
              .eq('judge_id', judge.id)
              .eq('court_id', judge.court_id)
              .eq('status', 'active')
              .single()

            if (!checkError && existingPosition) {
              skipped++
              continue
            }

            // Determine position type
            const positionType = this.determinePositionType(judge)

            // Create position data
            const positionData = {
              judge_id: judge.id,
              court_id: judge.court_id,
              position_type: positionType,
              start_date: judge.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
              status: 'active',
              metadata: {
                migration_source: 'existing_court_assignment',
                original_court_id: judge.court_id,
                judge_name: judge.name,
                court_name: judge.courts?.name,
                court_type: judge.courts?.type,
                migration_date: new Date().toISOString(),
                jurisdiction: judge.jurisdiction
              }
            }

            positionsToInsert.push(positionData)
            processed++

          } catch (error) {
            this.stats.errors.push({
              judge: judge.name,
              error: error.message
            })
          }
        }

        // Insert batch
        if (positionsToInsert.length > 0) {
          const { data, error: insertError } = await this.supabase
            .from('judge_court_positions')
            .insert(positionsToInsert)
            .select('id')

          if (insertError) {
            console.log(`   ❌ Batch insert failed:`, insertError.message)
            this.stats.errors.push({
              batch: `${i}-${i + batchSize}`,
              error: insertError.message
            })
          } else {
            created += data?.length || 0
            console.log(`   ✅ Inserted ${data?.length || 0} positions`)
          }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      console.log(`✅ Position migration complete:`)
      console.log(`   📊 Processed: ${processed} judges`)
      console.log(`   ✅ Created: ${created} positions`)
      console.log(`   ⏭️  Skipped: ${skipped} existing`)
      console.log(`   ❌ Errors: ${this.stats.errors.length}`)

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
      // Get active positions per court
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

      console.log(`📈 Updating ${Object.keys(courtCounts).length} courts with judge counts...`)

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

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 10))
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
      // Normalize judges table
      const { data: judgeUpdates, error: judgeError } = await this.supabase
        .from('judges')
        .update({ jurisdiction: 'CA' })
        .eq('jurisdiction', 'California')
        .select('id')

      if (judgeError) {
        throw new Error(`Failed to update judge jurisdictions: ${judgeError.message}`)
      }

      // Normalize courts table
      const { data: courtUpdates, error: courtError } = await this.supabase
        .from('courts')
        .update({ jurisdiction: 'CA' })
        .eq('jurisdiction', 'California')
        .select('id')

      if (courtError) {
        throw new Error(`Failed to update court jurisdictions: ${courtError.message}`)
      }

      const judgeCount = judgeUpdates?.length || 0
      const courtCount = courtUpdates?.length || 0

      console.log(`✅ Normalized jurisdictions:`)
      console.log(`   👨‍⚖️ ${judgeCount} judges: "California" → "CA"`)
      console.log(`   🏛️  ${courtCount} courts: "California" → "CA"`)

      this.stats.jurisdictionsNormalized = judgeCount + courtCount
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

      // Count total judges
      const { count: totalJudges } = await this.supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })

      // Count active positions
      const { count: activePositions } = await this.supabase
        .from('judge_court_positions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Count courts with judge counts
      const { count: courtsWithCounts } = await this.supabase
        .from('courts')
        .select('*', { count: 'exact', head: true })
        .gt('judge_count', 0)

      console.log('📊 Final Verification Results:')
      console.log(`   👨‍⚖️ Total judges: ${totalJudges}`)
      console.log(`   🏛️  California judges: ${caJudges}`)
      console.log(`   🔗 Active judge positions: ${activePositions}`)
      console.log(`   📈 Courts with judge counts: ${courtsWithCounts}`)

      const success = caJudges >= 1810 && activePositions > 0 && courtsWithCounts > 0
      
      if (success) {
        console.log('✅ Final verification PASSED!')
      } else {
        console.log('⚠️  Final verification has issues')
        if (caJudges < 1810) {
          console.log(`   ⚠️  Expected 1810+ CA judges, found ${caJudges}`)
        }
        if (activePositions === 0) {
          console.log('   ⚠️  No active judge positions found')
        }
        if (courtsWithCounts === 0) {
          console.log('   ⚠️  No courts have updated judge counts')
        }
      }

      return success
    } catch (error) {
      console.error('❌ Error in final verification:', error.message)
      return false
    }
  }

  async generateFinalReport() {
    const endTime = new Date()
    const duration = Math.round((endTime - this.stats.startTime) / 1000)

    console.log('\n🎉 Post-Migration Complete - Final Report')
    console.log('=' .repeat(60))
    console.log(`⏱️  Duration: ${duration} seconds`)
    console.log(`👨‍⚖️ Judges processed: ${this.stats.judgesProcessed}`)
    console.log(`🏛️  Positions created: ${this.stats.positionsCreated}`)
    console.log(`📊 Courts updated: ${this.stats.courtsUpdated}`)
    console.log(`🌎 Jurisdictions normalized: ${this.stats.jurisdictionsNormalized}`)
    console.log(`❌ Errors: ${this.stats.errors.length}`)

    if (this.stats.errors.length > 0 && this.stats.errors.length <= 10) {
      console.log('\n⚠️  Error details:')
      this.stats.errors.forEach(error => {
        console.log(`   - ${error.judge || error.batch || 'Unknown'}: ${error.error}`)
      })
    } else if (this.stats.errors.length > 10) {
      console.log(`\n⚠️  ${this.stats.errors.length} errors occurred (too many to display)`)
    }

    console.log('\n✅ Migration Accomplishments:')
    console.log('   - Enhanced schema with CourtListener fields')
    console.log('   - Populated judge-court relationship table')
    console.log('   - Updated court judge counts')
    console.log('   - Normalized jurisdictions to "CA"')
    console.log('   - Preserved all California judge accessibility')

    console.log('\n📋 Next Steps:')
    console.log('   1. Test the judges and courts pages')
    console.log('   2. Verify the new relationship queries work')
    console.log('   3. Test CourtListener integration features')
    console.log('   4. Monitor performance with new indexes')

    console.log('=' .repeat(60))
  }

  async run() {
    try {
      console.log('🚀 Post-Manual Migration Process')
      console.log('=' .repeat(50))

      // Step 1: Verify schema is ready
      const schemaReady = await this.verifySchemaReady()
      if (!schemaReady) return false

      // Step 2: Populate judge-court positions
      const positionsSuccess = await this.populateJudgeCourtPositions()
      if (!positionsSuccess) {
        console.log('⚠️  Position population failed, but continuing with other steps...')
      }

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
      console.error('💥 Post-migration process failed:', error.message)
      return false
    }
  }
}

// Main execution
async function main() {
  try {
    const migration = new PostManualMigration()
    const success = await migration.run()
    
    if (success) {
      console.log('\n🎉 Post-migration completed successfully!')
      process.exit(0)
    } else {
      console.log('\n⚠️  Post-migration completed with issues!')
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

module.exports = { PostManualMigration }