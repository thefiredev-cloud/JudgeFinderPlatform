-- ============================================================================
-- JudgeFinder Platform Database Migrations
-- Execute this script in Supabase Dashboard SQL Editor
-- URL: https://supabase.com/dashboard/project/xstlnicbnzdxlgfiewmg/sql
-- ============================================================================

-- PART 1: USER TABLES MIGRATION
-- ============================================================================

-- User bookmarks table
CREATE TABLE IF NOT EXISTS user_bookmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    judge_id BIGINT NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, judge_id)
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL, -- Clerk user ID
    default_jurisdiction TEXT DEFAULT 'CA',
    results_per_page INTEGER DEFAULT 20,
    email_notifications BOOLEAN DEFAULT true,
    judge_alerts BOOLEAN DEFAULT false,
    weekly_digest BOOLEAN DEFAULT true,
    security_alerts BOOLEAN DEFAULT true,
    email_frequency TEXT DEFAULT 'weekly' CHECK (email_frequency IN ('daily', 'weekly', 'monthly', 'never')),
    dark_mode BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity table for tracking searches, views, etc.
CREATE TABLE IF NOT EXISTS user_activity (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    activity_type TEXT NOT NULL CHECK (activity_type IN ('search', 'view', 'bookmark', 'compare', 'export')),
    activity_data JSONB, -- Flexible data storage for activity details
    judge_id BIGINT REFERENCES judges(id) ON DELETE SET NULL,
    search_query TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User saved searches table
CREATE TABLE IF NOT EXISTS user_saved_searches (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    search_name TEXT NOT NULL,
    search_query JSONB NOT NULL, -- Store search parameters as JSON
    alert_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, -- Clerk user ID
    notification_type TEXT NOT NULL CHECK (notification_type IN ('judge_update', 'new_case', 'system_alert', 'weekly_digest')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_judge_id ON user_bookmarks(judge_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_user_saved_searches_user_id ON user_saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = false;

-- Add RLS (Row Level Security) policies
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_bookmarks
CREATE POLICY "Users can manage their own bookmarks" ON user_bookmarks
    FOR ALL USING (auth.jwt() ->> 'sub' = user_id);

-- RLS policies for user_preferences
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (auth.jwt() ->> 'sub' = user_id);

-- RLS policies for user_activity
CREATE POLICY "Users can view their own activity" ON user_activity
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "System can insert user activity" ON user_activity
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- RLS policies for user_saved_searches
CREATE POLICY "Users can manage their own saved searches" ON user_saved_searches
    FOR ALL USING (auth.jwt() ->> 'sub' = user_id);

-- RLS policies for user_notifications
CREATE POLICY "Users can manage their own notifications" ON user_notifications
    FOR ALL USING (auth.jwt() ->> 'sub' = user_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_user_bookmarks_updated_at 
    BEFORE UPDATE ON user_bookmarks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_saved_searches_updated_at 
    BEFORE UPDATE ON user_saved_searches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 2: JUDGE SLUG MIGRATION
-- ============================================================================

-- Add slug column to judges table
ALTER TABLE judges 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_judges_slug ON judges(slug) WHERE slug IS NOT NULL;

-- Add unique constraint for slug (allow nulls for now during population)
-- Using DO block since PostgreSQL doesn't support IF NOT EXISTS with ADD CONSTRAINT
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'judges_slug_unique' 
        AND conrelid = 'judges'::regclass
    ) THEN
        ALTER TABLE judges 
        ADD CONSTRAINT judges_slug_unique UNIQUE(slug) DEFERRABLE INITIALLY DEFERRED;
    END IF;
END $$;

-- Function to generate slug from judge name
CREATE OR REPLACE FUNCTION generate_judge_slug(judge_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
    slug_exists BOOLEAN;
BEGIN
    -- Clean the name and create base slug
    base_slug := lower(trim(judge_name));
    
    -- Remove common prefixes
    base_slug := regexp_replace(base_slug, '^(judge|justice|the honorable|hon\.?)\s+', '', 'gi');
    
    -- Replace spaces and special characters with hyphens
    base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
    
    -- Remove leading/trailing hyphens and multiple consecutive hyphens
    base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    
    -- Start with base slug
    final_slug := base_slug;
    
    -- Check if slug already exists and increment if needed
    LOOP
        SELECT EXISTS(SELECT 1 FROM judges WHERE slug = final_slug) INTO slug_exists;
        
        IF NOT slug_exists THEN
            EXIT;
        END IF;
        
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Update all judges with slugs
UPDATE judges 
SET slug = generate_judge_slug(name)
WHERE slug IS NULL AND name IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN judges.slug IS 'SEO-friendly URL slug generated from judge name for optimal search engine indexing';

-- Verify all judges have slugs
DO $$
DECLARE
    null_slug_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_slug_count FROM judges WHERE slug IS NULL;
    
    IF null_slug_count > 0 THEN
        RAISE WARNING 'Found % judges without slugs - manual intervention may be required', null_slug_count;
    ELSE
        RAISE NOTICE 'Successfully generated slugs for all judges';
    END IF;
END;
$$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Final verification query
SELECT 
    'User Tables' as migration_part,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_bookmarks') 
        THEN '✅ SUCCESS' 
        ELSE '❌ FAILED' 
    END as status
UNION ALL
SELECT 
    'Judge Slugs' as migration_part,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'judges' AND column_name = 'slug') 
        THEN '✅ SUCCESS' 
        ELSE '❌ FAILED' 
    END as status;

SELECT COUNT(*) as judges_with_slugs FROM judges WHERE slug IS NOT NULL;