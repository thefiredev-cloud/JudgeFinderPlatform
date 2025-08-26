/**
 * Test Missing Columns
 * 
 * Attempts to populate the missing columns with default values
 * to test if they exist or if we need to add them manually.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testMissingColumns() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log('🧪 Testing missing columns...')

  // Test courthouse_metadata column on courts
  try {
    console.log('\n📋 Testing courthouse_metadata column on courts table...')
    
    // Try to update a single court with default metadata
    const { data: courtTest, error: courtError } = await supabase
      .from('courts')
      .update({ 
        courthouse_metadata: {} 
      })
      .eq('id', (await supabase.from('courts').select('id').limit(1).single()).data.id)
      .select()

    if (courtError) {
      console.log('❌ courthouse_metadata column missing:', courtError.message)
    } else {
      console.log('✅ courthouse_metadata column exists and is writable')
    }
  } catch (error) {
    console.log('❌ Error testing courthouse_metadata:', error.message)
  }

  // Test positions column on judges
  try {
    console.log('\n📋 Testing positions column on judges table...')
    
    // Try to update a single judge with default positions
    const { data: judgeTest, error: judgeError } = await supabase
      .from('judges')
      .update({ 
        positions: [] 
      })
      .eq('id', (await supabase.from('judges').select('id').limit(1).single()).data.id)
      .select()

    if (judgeError) {
      console.log('❌ positions column missing:', judgeError.message)
    } else {
      console.log('✅ positions column exists and is writable')
    }
  } catch (error) {
    console.log('❌ Error testing positions:', error.message)
  }

  // If columns don't exist, show SQL to add them
  console.log('\n📋 If columns are missing, execute this SQL in Supabase dashboard:')
  console.log('=' .repeat(60))
  console.log("ALTER TABLE courts ADD COLUMN IF NOT EXISTS courthouse_metadata JSONB DEFAULT '{}'::jsonb;")
  console.log("ALTER TABLE judges ADD COLUMN IF NOT EXISTS positions JSONB DEFAULT '[]'::jsonb;")
  console.log('=' .repeat(60))
}

testMissingColumns().catch(console.error)