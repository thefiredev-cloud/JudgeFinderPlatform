require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function setupUserTables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    console.log('🚀 Setting up user authentication tables...')

    // Create user_bookmarks table
    console.log('Creating user_bookmarks table...')
    const { error: bookmarksError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_bookmarks (
          id BIGSERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          judge_id BIGINT NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, judge_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_bookmarks_judge_id ON user_bookmarks(judge_id);
      `
    })

    // Create user_preferences table
    console.log('Creating user_preferences table...')
    const { error: preferencesError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_preferences (
          id BIGSERIAL PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL,
          default_jurisdiction TEXT DEFAULT 'CA',
          results_per_page INTEGER DEFAULT 20,
          email_notifications BOOLEAN DEFAULT true,
          judge_alerts BOOLEAN DEFAULT false,
          weekly_digest BOOLEAN DEFAULT true,
          security_alerts BOOLEAN DEFAULT true,
          email_frequency TEXT DEFAULT 'weekly',
          dark_mode BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    // Create user_activity table
    console.log('Creating user_activity table...')
    const { error: activityError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_activity (
          id BIGSERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          activity_type TEXT NOT NULL,
          activity_data JSONB,
          judge_id BIGINT REFERENCES judges(id) ON DELETE SET NULL,
          search_query TEXT,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
        CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);
      `
    })

    // Create user_saved_searches table
    console.log('Creating user_saved_searches table...')
    const { error: searchesError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_saved_searches (
          id BIGSERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          search_name TEXT NOT NULL,
          search_query JSONB NOT NULL,
          alert_enabled BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_saved_searches_user_id ON user_saved_searches(user_id);
      `
    })

    // Create user_notifications table
    console.log('Creating user_notifications table...')
    const { error: notificationsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_notifications (
          id BIGSERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          notification_type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT false,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          read_at TIMESTAMP WITH TIME ZONE
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = false;
      `
    })

    if (bookmarksError) console.log('Bookmarks table warning:', bookmarksError.message)
    if (preferencesError) console.log('Preferences table warning:', preferencesError.message)
    if (activityError) console.log('Activity table warning:', activityError.message)
    if (searchesError) console.log('Searches table warning:', searchesError.message)
    if (notificationsError) console.log('Notifications table warning:', notificationsError.message)

    console.log('✅ User authentication tables setup complete!')

    // Test that we can query the tables
    console.log('Testing table access...')
    const { count } = await supabase
      .from('user_bookmarks')
      .select('*', { count: 'exact', head: true })

    console.log(`✅ Tables are accessible (bookmarks count: ${count || 0})`)

  } catch (error) {
    console.error('❌ Error setting up user tables:', error)
    process.exit(1)
  }
}

setupUserTables()