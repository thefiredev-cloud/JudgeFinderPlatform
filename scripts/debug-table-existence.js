/**
 * Debug Table Existence
 * 
 * Checks if the judge_court_positions table actually exists
 * and what operations are possible on it.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function debugTableExistence() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('🔍 Debugging judge_court_positions table existence...')

  // Test 1: Try to count records (HEAD request)
  try {
    console.log('\n📋 Test 1: Counting records with HEAD request...')
    const { count, error } = await supabase
      .from('judge_court_positions')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log('❌ HEAD request failed:', error.message)
    } else {
      console.log(`✅ HEAD request succeeded: ${count} records`)
    }
  } catch (error) {
    console.log('❌ HEAD request error:', error.message)
  }

  // Test 2: Try to select records
  try {
    console.log('\n📋 Test 2: Selecting records...')
    const { data, error } = await supabase
      .from('judge_court_positions')
      .select('*')
      .limit(1)

    if (error) {
      console.log('❌ SELECT failed:', error.message)
    } else {
      console.log(`✅ SELECT succeeded: ${data?.length || 0} records returned`)
      if (data && data.length > 0) {
        console.log('📋 Sample record columns:', Object.keys(data[0]))
      }
    }
  } catch (error) {
    console.log('❌ SELECT error:', error.message)
  }

  // Test 3: Try to insert a test record
  try {
    console.log('\n📋 Test 3: Testing insert capability...')
    
    // Get a sample judge and court for the test
    const { data: sampleJudge } = await supabase
      .from('judges')
      .select('id, name')
      .limit(1)
      .single()

    const { data: sampleCourt } = await supabase
      .from('courts')
      .select('id, name')
      .limit(1)
      .single()

    if (sampleJudge && sampleCourt) {
      const testRecord = {
        judge_id: sampleJudge.id,
        court_id: sampleCourt.id,
        position_type: 'Test Judge',
        status: 'active',
        metadata: { test: true }
      }

      const { data, error } = await supabase
        .from('judge_court_positions')
        .insert([testRecord])
        .select()

      if (error) {
        console.log('❌ INSERT failed:', error.message)
      } else {
        console.log('✅ INSERT succeeded - table is writable')
        
        // Clean up the test record
        if (data && data[0]) {
          await supabase
            .from('judge_court_positions')
            .delete()
            .eq('id', data[0].id)
          console.log('🗑️  Test record cleaned up')
        }
      }
    } else {
      console.log('⚠️  Cannot test insert - no sample judge/court found')
    }
  } catch (error) {
    console.log('❌ INSERT test error:', error.message)
  }

  // Test 4: List all tables (if possible)
  try {
    console.log('\n📋 Test 4: Checking table permissions...')
    
    // Try different table operations to understand permissions
    const tables = ['judges', 'courts', 'judge_court_positions']
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: ${count} records (accessible)`)
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
      }
    }
  } catch (error) {
    console.log('❌ Permission test error:', error.message)
  }

  console.log('\n📋 Summary:')
  console.log('- If HEAD/SELECT work but INSERT fails, table exists but may have constraints')
  console.log('- If all operations fail, table may not exist or have permission issues')
  console.log('- Check Supabase dashboard for table structure and RLS policies')
}

debugTableExistence().catch(console.error)