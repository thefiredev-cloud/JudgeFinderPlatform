const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function verify() {
  console.log('🔍 Verifying database migrations...\n')
  
  try {
    // Check user tables
    const { data: userTables, error: userTablesError } = await supabase
      .from('user_bookmarks')
      .select('id')
      .limit(1)
    
    if (userTablesError) {
      console.log('❌ User bookmarks table:', userTablesError.message)
    } else {
      console.log('✅ User bookmarks table exists and accessible')
    }
    
    // Check user preferences table
    const { data: userPrefs, error: userPrefsError } = await supabase
      .from('user_preferences')
      .select('id')
      .limit(1)
    
    if (userPrefsError) {
      console.log('❌ User preferences table:', userPrefsError.message)
    } else {
      console.log('✅ User preferences table exists and accessible')
    }
    
    // Check judge slug column
    const { data: judges, error: judgesError } = await supabase
      .from('judges')
      .select('id, name, slug')
      .limit(5)
    
    if (judgesError) {
      console.log('❌ Judge slug column:', judgesError.message)
    } else {
      console.log('✅ Judge slug column exists and accessible')
      console.log('📊 Sample judges with slugs:')
      judges.forEach(judge => {
        console.log(`  - ${judge.name}: ${judge.slug || 'NULL'}`)
      })
    }
    
    // Count judges with slugs
    const { count, error: countError } = await supabase
      .from('judges')
      .select('id', { count: 'exact' })
      .not('slug', 'is', null)
    
    if (!countError) {
      console.log(`✅ ${count} judges have slugs generated`)
    } else {
      console.log('❌ Error counting judges with slugs:', countError.message)
    }
    
    // Test user activity table
    const { data: userActivity, error: activityError } = await supabase
      .from('user_activity')
      .select('id')
      .limit(1)
    
    if (activityError) {
      console.log('❌ User activity table:', activityError.message)
    } else {
      console.log('✅ User activity table exists and accessible')
    }
    
    console.log('\n🎉 Migration verification complete!')
    
  } catch (error) {
    console.error('❌ Verification error:', error.message)
  }
}

verify()