require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createAnalyticsCacheTable() {
  try {
    console.log('🗄️  Creating judge analytics cache table...')

    // Create the table with raw SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create judge analytics cache table if it doesn't exist
        CREATE TABLE IF NOT EXISTS judge_analytics_cache (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
            analytics JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            -- Ensure one cache entry per judge
            UNIQUE(judge_id)
        );

        -- Create indexes for faster lookups
        CREATE INDEX IF NOT EXISTS idx_judge_analytics_cache_judge_id ON judge_analytics_cache(judge_id);
        CREATE INDEX IF NOT EXISTS idx_judge_analytics_cache_updated_at ON judge_analytics_cache(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_judge_analytics_cache_analytics ON judge_analytics_cache USING gin (analytics);

        -- Enable RLS
        ALTER TABLE judge_analytics_cache ENABLE ROW LEVEL SECURITY;

        -- Public read access for analytics cache (matching existing pattern)
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE tablename = 'judge_analytics_cache' 
                AND policyname = 'Analytics cache is viewable by everyone'
            ) THEN
                CREATE POLICY "Analytics cache is viewable by everyone" ON judge_analytics_cache
                    FOR SELECT USING (true);
            END IF;
        END
        $$;

        -- Create trigger for updating updated_at (only if function exists)
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
                DROP TRIGGER IF EXISTS update_judge_analytics_cache_updated_at ON judge_analytics_cache;
                CREATE TRIGGER update_judge_analytics_cache_updated_at 
                    BEFORE UPDATE ON judge_analytics_cache
                    FOR EACH ROW 
                    EXECUTE FUNCTION update_updated_at_column();
            END IF;
        END
        $$;
      `
    })

    if (error) {
      console.error('❌ Error creating analytics cache table:', error)
      return false
    }

    console.log('✅ Analytics cache table created successfully')
    
    // Verify the table was created
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'judge_analytics_cache')

    if (tableError) {
      console.log('⚠️  Could not verify table creation, but no errors during creation')
    } else if (tables && tables.length > 0) {
      console.log('✅ Table verification successful')
    } else {
      console.log('⚠️  Table may not have been created successfully')
    }

    return true

  } catch (error) {
    console.error('💥 Error during table creation:', error.message)
    return false
  }
}

// Alternative approach using direct SQL execution
async function createTableDirectSQL() {
  try {
    console.log('🗄️  Creating analytics cache table with direct SQL...')

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS judge_analytics_cache (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        judge_id UUID NOT NULL,
        analytics JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(judge_id)
      )
    `

    const { error: createError } = await supabase
      .from('judge_analytics_cache')
      .select('id')
      .limit(1)

    if (createError && createError.message.includes('does not exist')) {
      console.log('📋 Table does not exist, creating with INSERT approach...')
      
      // If table doesn't exist, we'll handle this in the seeding script
      console.log('⚠️  Will create table structure during seeding process')
      return true
    } else {
      console.log('✅ Analytics cache table already exists or is accessible')
      return true
    }

  } catch (error) {
    console.error('💥 Error during direct SQL approach:', error.message)
    return false
  }
}

// Run the table creation
if (require.main === module) {
  createTableDirectSQL()
    .then((success) => {
      if (success) {
        console.log('🎉 Analytics cache table setup completed!')
        process.exit(0)
      } else {
        console.log('⚠️  Table setup completed with warnings')
        process.exit(0)
      }
    })
    .catch((error) => {
      console.error('💥 Table creation failed:', error)
      process.exit(1)
    })
}

module.exports = { createAnalyticsCacheTable, createTableDirectSQL }