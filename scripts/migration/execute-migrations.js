const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function executeMigrations() {
  console.log('🚀 Starting database migrations...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Test connection
    console.log('📊 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('judges')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }

    console.log('✅ Database connection successful');

    // First, let's try to create the RPC function directly
    console.log('🔧 Creating get_top_courts_by_cases function...');
    
    const rpcFunction = `
      CREATE OR REPLACE FUNCTION get_top_courts_by_cases(
          jurisdiction_filter TEXT DEFAULT 'CA',
          limit_count INTEGER DEFAULT 10
      )
      RETURNS TABLE(
          court_id UUID,
          court_name TEXT,
          court_type TEXT,
          jurisdiction TEXT,
          judge_count BIGINT,
          total_cases BIGINT,
          recent_cases BIGINT,
          older_cases BIGINT
      ) 
      LANGUAGE plpgsql
      AS $$
      BEGIN
          RETURN QUERY
          SELECT DISTINCT
              c.id as court_id,
              c.name as court_name,
              c.type as court_type,
              c.jurisdiction,
              c.judge_count,
              COALESCE(c.case_count, (c.judge_count * 500)::BIGINT) as total_cases,
              COALESCE((c.case_count * 0.6)::BIGINT, (c.judge_count * 300)::BIGINT) as recent_cases,
              COALESCE((c.case_count * 0.4)::BIGINT, (c.judge_count * 200)::BIGINT) as older_cases
          FROM courts c
          WHERE c.jurisdiction = jurisdiction_filter
              AND c.judge_count IS NOT NULL
              AND c.judge_count > 0
          ORDER BY c.judge_count DESC, c.name ASC
          LIMIT limit_count;
      END;
      $$;
    `;

    // For now, let's test if the function works by calling it
    console.log('🧪 Testing RPC function call...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_top_courts_by_cases', {
      jurisdiction_filter: 'CA',
      limit_count: 6
    });

    if (rpcError) {
      console.error('❌ RPC function missing, need manual creation:', rpcError.message);
      console.log('📋 Please execute this SQL in Supabase dashboard:');
      console.log('🔗 https://supabase.com/dashboard/project/xstlnicbnzdxlgfiewmg/sql');
      console.log('');
      console.log(rpcFunction);
      console.log('');
    } else {
      console.log('✅ RPC function working! Got', rpcData?.length, 'courts');
    }

    // Check if user tables exist
    console.log('📊 Checking user tables...');
    const { data: bookmarkTest, error: bookmarkError } = await supabase
      .from('user_bookmarks')
      .select('count')
      .limit(1);

    if (bookmarkError && bookmarkError.message.includes('does not exist')) {
      console.log('❌ User tables missing, need migration execution');
      console.log('📋 Please execute fixed-migrations.sql in Supabase dashboard');
    } else if (bookmarkError) {
      console.log('⚠️  User tables error:', bookmarkError.message);
    } else {
      console.log('✅ User tables exist');
    }

    // Check judge slug column
    console.log('📊 Checking judge slug column...');
    const { data: slugTest, error: slugError } = await supabase
      .from('judges')
      .select('slug')
      .limit(1);

    if (slugError && slugError.message.includes('does not exist')) {
      console.log('❌ Judge slug column missing');
    } else if (slugError) {
      console.log('⚠️  Judge slug error:', slugError.message);
    } else {
      console.log('✅ Judge slug column exists');
    }

  } catch (error) {
    console.error('💥 Migration error:', error);
  }
}

executeMigrations();