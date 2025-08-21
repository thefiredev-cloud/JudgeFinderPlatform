const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkMigrationStatus() {
  const supabase = createClient(supabaseUrl, serviceKey)
  console.log('🔍 Checking current migration status...\n')
  
  try {
    // Check user_bookmarks table
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('user_bookmarks')
      .select('id')
      .limit(1)
    
    const userTablesExist = !bookmarksError
    console.log(userTablesExist ? '✅ User tables exist' : '❌ User tables missing')
    
    // Check judge slug column by attempting to select it
    const { data: judges, error: judgesError } = await supabase
      .from('judges')
      .select('id, name, slug')
      .limit(1)
    
    const slugColumnExists = !judgesError
    console.log(slugColumnExists ? '✅ Judge slug column exists' : '❌ Judge slug column missing')
    
    if (userTablesExist && slugColumnExists) {
      console.log('\n🎉 All migrations appear to be applied!')
      return true
    } else {
      console.log('\n⚠️  Some migrations are missing')
      console.log('\n📋 Manual migration required:')
      console.log('1. Go to Supabase Dashboard SQL Editor:')
      console.log(`   https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql`)
      console.log('2. Copy and execute scripts/create-user-tables.sql')
      console.log('3. Copy and execute supabase/migrations/20250820_001_add_judge_slug_column.sql')
      return false
    }
    
  } catch (error) {
    console.error('❌ Status check failed:', error.message)
    return false
  }
}

checkMigrationStatus()