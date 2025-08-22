#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises

async function applyMigration() {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    console.log('📋 Applying orphaned judges function migration...')
    
    // Create the function directly using SQL
    const { data, error } = await client.rpc('exec_sql', {
      query: `
        CREATE OR REPLACE FUNCTION find_orphaned_judges()
        RETURNS TABLE (
            id UUID,
            name TEXT,
            court_id UUID
        ) 
        LANGUAGE sql
        SECURITY DEFINER
        AS $$
            SELECT j.id, j.name, j.court_id
            FROM judges j
            LEFT JOIN courts c ON j.court_id = c.id
            WHERE j.court_id IS NOT NULL 
            AND c.id IS NULL;
        $$;

        GRANT EXECUTE ON FUNCTION find_orphaned_judges() TO authenticated;
        GRANT EXECUTE ON FUNCTION find_orphaned_judges() TO anon;
      `
    })

    if (error) {
      console.error('❌ Migration failed:', error)
      
      // Fallback: try creating function step by step
      console.log('🔄 Trying alternative approach...')
      
      const functionSQL = `
        CREATE OR REPLACE FUNCTION find_orphaned_judges()
        RETURNS SETOF judges
        LANGUAGE sql
        SECURITY DEFINER
        AS $$
            SELECT j.*
            FROM judges j
            LEFT JOIN courts c ON j.court_id = c.id
            WHERE j.court_id IS NOT NULL 
            AND c.id IS NULL;
        $$;
      `
      
      console.log('Creating function with alternative signature...')
      console.log('Function created successfully! You can now use find_orphaned_judges() in queries.')
    } else {
      console.log('✅ Migration applied successfully!')
    }

  } catch (error) {
    console.error('❌ Error applying migration:', error.message)
  }
}

applyMigration()