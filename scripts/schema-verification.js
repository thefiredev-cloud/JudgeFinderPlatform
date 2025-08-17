/**
 * Database Schema Verification
 * 
 * Checks current schema state and provides detailed information
 * about what migrations are needed.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

class SchemaVerifier {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }

  async checkTableColumns(tableName, expectedColumns) {
    console.log(`\n🔍 Checking ${tableName} table...`)
    
    try {
      // Get a sample record to see available columns
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1)
        .single()

      if (error && !error.message.includes('No rows')) {
        console.log(`❌ Error accessing ${tableName}:`, error.message)
        return { exists: false, columns: [] }
      }

      const availableColumns = data ? Object.keys(data) : []
      console.log(`📋 Available columns: ${availableColumns.join(', ')}`)

      const missingColumns = expectedColumns.filter(col => !availableColumns.includes(col))
      const hasAllColumns = missingColumns.length === 0

      if (hasAllColumns) {
        console.log(`✅ ${tableName} has all required columns`)
      } else {
        console.log(`❌ Missing columns in ${tableName}: ${missingColumns.join(', ')}`)
      }

      return {
        exists: true,
        columns: availableColumns,
        missingColumns,
        hasAllColumns
      }
    } catch (error) {
      console.log(`❌ Failed to check ${tableName}:`, error.message)
      return { exists: false, columns: [], error: error.message }
    }
  }

  async checkTableExists(tableName) {
    try {
      const { count, error } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ Table ${tableName} does not exist or is not accessible`)
        return { exists: false, count: 0, error: error.message }
      }

      console.log(`✅ Table ${tableName} exists with ${count} records`)
      return { exists: true, count }
    } catch (error) {
      console.log(`❌ Error checking ${tableName}:`, error.message)
      return { exists: false, count: 0, error: error.message }
    }
  }

  async performCompleteVerification() {
    console.log('🔍 Performing Complete Schema Verification')
    console.log('=' .repeat(60))

    const results = {}

    // Check courts table
    results.courts = await this.checkTableColumns('courts', [
      'id', 'name', 'type', 'jurisdiction', 'courtlistener_id', 'courthouse_metadata'
    ])

    // Check judges table  
    results.judges = await this.checkTableColumns('judges', [
      'id', 'name', 'court_id', 'jurisdiction', 'courtlistener_id', 'positions'
    ])

    // Check judge_court_positions table
    results.positions = await this.checkTableExists('judge_court_positions')

    // Generate summary
    console.log('\n📊 Migration Summary')
    console.log('=' .repeat(60))

    const courtsReady = results.courts.hasAllColumns
    const judgesReady = results.judges.hasAllColumns  
    const positionsReady = results.positions.exists

    console.log(`Courts table ready: ${courtsReady ? '✅' : '❌'}`)
    console.log(`Judges table ready: ${judgesReady ? '✅' : '❌'}`)
    console.log(`Positions table exists: ${positionsReady ? '✅' : '❌'}`)

    const allReady = courtsReady && judgesReady && positionsReady
    
    if (allReady) {
      console.log('\n🎉 All schema migrations are complete!')
      console.log('You can proceed with populating the judge_court_positions table.')
    } else {
      console.log('\n⚠️  Schema migrations needed:')
      
      if (!courtsReady) {
        console.log('  📋 Courts table needs:')
        results.courts.missingColumns?.forEach(col => {
          console.log(`     - ${col}`)
        })
      }
      
      if (!judgesReady) {
        console.log('  📋 Judges table needs:')
        results.judges.missingColumns?.forEach(col => {
          console.log(`     - ${col}`)
        })
      }
      
      if (!positionsReady) {
        console.log('  📋 judge_court_positions table needs to be created')
      }
    }

    console.log('\n📋 Recommended Next Steps:')
    if (!allReady) {
      console.log('1. Execute the SQL migrations manually in Supabase SQL Editor')
      console.log('2. Re-run this verification script to confirm changes')
      console.log('3. Proceed with data migration once schema is complete')
    } else {
      console.log('1. Run the judge-court data migration script')
      console.log('2. Update court judge counts')
      console.log('3. Handle jurisdiction normalization')
      console.log('4. Verify all California judges remain accessible')
    }

    return {
      allReady,
      courtsReady,
      judgesReady,
      positionsReady,
      results
    }
  }

  async getDetailedCounts() {
    console.log('\n📊 Current Database Counts')
    console.log('=' .repeat(40))

    try {
      // Count judges
      const { count: judgeCount } = await this.supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })
      
      // Count California judges
      const { count: caJudgeCount } = await this.supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })
        .in('jurisdiction', ['CA', 'California'])

      // Count courts
      const { count: courtCount } = await this.supabase
        .from('courts')
        .select('*', { count: 'exact', head: true })

      // Count California courts
      const { count: caCourtCount } = await this.supabase
        .from('courts')
        .select('*', { count: 'exact', head: true })
        .in('jurisdiction', ['CA', 'California'])

      // Count judge-court positions
      const { count: positionCount } = await this.supabase
        .from('judge_court_positions')
        .select('*', { count: 'exact', head: true })

      console.log(`Total judges: ${judgeCount}`)
      console.log(`California judges: ${caJudgeCount}`)
      console.log(`Total courts: ${courtCount}`)
      console.log(`California courts: ${caCourtCount}`)
      console.log(`Judge-court positions: ${positionCount}`)

      return {
        judgeCount,
        caJudgeCount,
        courtCount,
        caCourtCount,
        positionCount
      }
    } catch (error) {
      console.error('❌ Error getting counts:', error.message)
      return null
    }
  }
}

// Main execution
async function main() {
  try {
    const verifier = new SchemaVerifier()
    
    await verifier.getDetailedCounts()
    const verification = await verifier.performCompleteVerification()
    
    process.exit(verification.allReady ? 0 : 1)
  } catch (error) {
    console.error('💥 Verification failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { SchemaVerifier }