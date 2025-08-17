/**
 * Verify Table State
 * 
 * Comprehensive verification of database table existence and structure
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

class TableStateVerifier {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }

  async verifyTableExistence() {
    console.log('🔍 Verifying table existence using multiple methods...')
    
    const results = {}

    // Method 1: Try to select from table
    try {
      const { data, error } = await this.supabase
        .from('judge_court_positions')
        .select('*')
        .limit(1)
      
      if (error) {
        results.method1 = { exists: false, error: error.message }
        console.log('   ❌ Method 1 (select): Table not found -', error.message)
      } else {
        results.method1 = { exists: true, data: data }
        console.log('   ✅ Method 1 (select): Table exists, returned', data?.length || 0, 'rows')
      }
    } catch (error) {
      results.method1 = { exists: false, error: error.message }
      console.log('   ❌ Method 1 (select): Exception -', error.message)
    }

    // Method 2: Try to insert (but don't actually insert)
    try {
      const testData = {
        judge_id: '00000000-0000-0000-0000-000000000000',
        court_id: '00000000-0000-0000-0000-000000000000',
        position_type: 'Test',
        status: 'test'
      }

      // This will fail due to foreign key constraints, but should fail differently than "table not found"
      const { error } = await this.supabase
        .from('judge_court_positions')
        .insert([testData])

      if (error) {
        if (error.message.includes('not find the table')) {
          results.method2 = { exists: false, error: error.message }
          console.log('   ❌ Method 2 (insert): Table not found -', error.message)
        } else {
          results.method2 = { exists: true, error: error.message }
          console.log('   ✅ Method 2 (insert): Table exists but insert failed (expected) -', error.message.substring(0, 50) + '...')
        }
      } else {
        results.method2 = { exists: true, error: null }
        console.log('   ⚠️  Method 2 (insert): Unexpected success')
      }
    } catch (error) {
      results.method2 = { exists: false, error: error.message }
      console.log('   ❌ Method 2 (insert): Exception -', error.message)
    }

    // Method 3: Try to get table info (if available)
    try {
      const { data, error } = await this.supabase.rpc('get_table_info', {
        table_name: 'judge_court_positions'
      })

      if (error) {
        results.method3 = { exists: false, error: error.message }
        console.log('   ⚠️  Method 3 (rpc): Function not available -', error.message)
      } else {
        results.method3 = { exists: true, data: data }
        console.log('   ✅ Method 3 (rpc): Table info retrieved')
      }
    } catch (error) {
      results.method3 = { exists: false, error: error.message }
      console.log('   ⚠️  Method 3 (rpc): Exception -', error.message)
    }

    return results
  }

  async verifyOtherTables() {
    console.log('\n🔍 Verifying other tables for comparison...')
    
    const tables = ['judges', 'courts', 'cases']
    
    for (const table of tables) {
      try {
        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`)
        } else {
          console.log(`   ✅ ${table}: Accessible, ${data?.length || 0} test rows`)
        }
      } catch (error) {
        console.log(`   ❌ ${table}: Exception - ${error.message}`)
      }
    }
  }

  async checkSchemaColumns() {
    console.log('\n🔍 Verifying required columns...')
    
    // Check courthouse_metadata
    try {
      const { data, error } = await this.supabase
        .from('courts')
        .select('courthouse_metadata')
        .limit(1)
      
      if (error) {
        console.log('   ❌ courts.courthouse_metadata:', error.message)
      } else {
        console.log('   ✅ courts.courthouse_metadata: Column exists')
      }
    } catch (error) {
      console.log('   ❌ courts.courthouse_metadata: Exception -', error.message)
    }

    // Check positions
    try {
      const { data, error } = await this.supabase
        .from('judges')
        .select('positions')
        .limit(1)
      
      if (error) {
        console.log('   ❌ judges.positions:', error.message)
      } else {
        console.log('   ✅ judges.positions: Column exists')
      }
    } catch (error) {
      console.log('   ❌ judges.positions: Exception -', error.message)
    }
  }

  async run() {
    try {
      console.log('🚀 Table State Verification')
      console.log('=' .repeat(60))

      // Verify judge_court_positions table
      const tableResults = await this.verifyTableExistence()

      // Verify other tables
      await this.verifyOtherTables()

      // Check required columns
      await this.checkSchemaColumns()

      // Summary
      console.log('\n📊 Summary:')
      const tableExists = Object.values(tableResults).some(result => result.exists)
      
      if (tableExists) {
        console.log('✅ judge_court_positions table appears to exist')
        console.log('⚠️  Schema cache issue may be preventing data operations')
        console.log('💡 Recommendation: Try restarting application or clearing cache')
      } else {
        console.log('❌ judge_court_positions table does not exist')
        console.log('📝 Recommendation: Execute the migration SQL manually')
      }

      return tableExists
    } catch (error) {
      console.error('💥 Error:', error.message)
      return false
    }
  }
}

// Main execution
async function main() {
  try {
    const verifier = new TableStateVerifier()
    const exists = await verifier.run()
    
    process.exit(exists ? 0 : 1)
  } catch (error) {
    console.error('💥 Unhandled error:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { TableStateVerifier }