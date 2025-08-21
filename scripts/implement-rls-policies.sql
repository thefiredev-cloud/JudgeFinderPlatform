-- ========================================
-- ROW LEVEL SECURITY IMPLEMENTATION
-- JudgeFinder Platform - Judicial Transparency Tool
-- ========================================

-- Step 1: Create utility functions for consistent authentication
-- ========================================

-- Function to get current Clerk user ID
CREATE OR REPLACE FUNCTION get_clerk_user_id() 
RETURNS TEXT AS $$
BEGIN
  RETURN auth.jwt() ->> 'sub';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  admin_emails TEXT[];
BEGIN
  -- Get user email from JWT
  user_email := auth.jwt() ->> 'email';
  
  -- Return false if no email
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get admin emails from environment setting
  -- This should be set via: ALTER DATABASE postgres SET app.admin_emails = 'admin1@example.com,admin2@example.com';
  BEGIN
    admin_emails := string_to_array(
      current_setting('app.admin_emails'), 
      ','
    );
  EXCEPTION WHEN OTHERS THEN
    -- If setting not found, return false
    RETURN false;
  END;
  
  RETURN user_email = ANY(admin_emails);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has service role (for system operations)
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Fix Missing RLS on Performance Metrics
-- ========================================

-- Enable RLS on performance_metrics table (was missing)
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Admin can manage all performance metrics
CREATE POLICY "Admin access for performance metrics" ON performance_metrics
  FOR ALL USING (is_admin_user() OR is_service_role());

-- Public can insert performance metrics (for anonymous tracking)
CREATE POLICY "Public can insert performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (true);

-- Step 3: Standardize User Table Policies
-- ========================================

-- Drop and recreate user bookmark policies with consistent auth
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON user_bookmarks;
CREATE POLICY "Users can manage their own bookmarks" ON user_bookmarks
  FOR ALL USING (get_clerk_user_id() = user_id OR is_service_role());

-- Drop and recreate user preferences policies  
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
CREATE POLICY "Users can manage their own preferences" ON user_preferences
  FOR ALL USING (get_clerk_user_id() = user_id OR is_service_role());

-- Drop and recreate user activity policies
DROP POLICY IF EXISTS "Users can view their own activity" ON user_activity;
DROP POLICY IF EXISTS "System can insert user activity" ON user_activity;

CREATE POLICY "Users can view their own activity" ON user_activity
  FOR SELECT USING (get_clerk_user_id() = user_id OR is_admin_user() OR is_service_role());

CREATE POLICY "System can insert user activity" ON user_activity
  FOR INSERT WITH CHECK (get_clerk_user_id() = user_id OR is_service_role());

-- Drop and recreate saved searches policies
DROP POLICY IF EXISTS "Users can manage their own saved searches" ON user_saved_searches;
CREATE POLICY "Users can manage their own saved searches" ON user_saved_searches
  FOR ALL USING (get_clerk_user_id() = user_id OR is_service_role());

-- Drop and recreate notifications policies
DROP POLICY IF EXISTS "Users can manage their own notifications" ON user_notifications;
CREATE POLICY "Users can manage their own notifications" ON user_notifications
  FOR ALL USING (get_clerk_user_id() = user_id OR is_service_role());

-- Step 4: Enhance Admin-Only Policies
-- ========================================

-- Update KPI metrics to use new admin function
DROP POLICY IF EXISTS "Admin access for KPI metrics" ON kpi_metrics;
CREATE POLICY "Admin access for KPI metrics" ON kpi_metrics
  FOR ALL USING (is_admin_user() OR is_service_role());

-- Update marketing campaigns
DROP POLICY IF EXISTS "Admin access for marketing campaigns" ON marketing_campaigns;
CREATE POLICY "Admin access for marketing campaigns" ON marketing_campaigns
  FOR ALL USING (is_admin_user() OR is_service_role());

-- Update campaign prospects
DROP POLICY IF EXISTS "Admin access for campaign prospects" ON campaign_prospects;
CREATE POLICY "Admin access for campaign prospects" ON campaign_prospects
  FOR ALL USING (is_admin_user() OR is_service_role());

-- Update email sequences
DROP POLICY IF EXISTS "Admin access for email sequences" ON email_sequences;
CREATE POLICY "Admin access for email sequences" ON email_sequences
  FOR ALL USING (is_admin_user() OR is_service_role());

DROP POLICY IF EXISTS "Admin access for email sequence steps" ON email_sequence_steps;
CREATE POLICY "Admin access for email sequence steps" ON email_sequence_steps
  FOR ALL USING (is_admin_user() OR is_service_role());

-- Update admin analytics
DROP POLICY IF EXISTS "Admin access for admin analytics" ON admin_analytics;
CREATE POLICY "Admin access for admin analytics" ON admin_analytics
  FOR ALL USING (is_admin_user() OR is_service_role());

-- Step 5: Enhance Security for Sensitive Data
-- ========================================

-- Revenue tracking - users can only see their own data
DROP POLICY IF EXISTS "Users can view own revenue tracking" ON revenue_tracking;
CREATE POLICY "Users can view own revenue tracking" ON revenue_tracking
  FOR SELECT USING (get_clerk_user_id() = user_id OR is_admin_user() OR is_service_role());

CREATE POLICY "System can insert revenue tracking" ON revenue_tracking
  FOR INSERT WITH CHECK (is_service_role());

CREATE POLICY "Admin can manage revenue tracking" ON revenue_tracking
  FOR UPDATE USING (is_admin_user() OR is_service_role());

-- Payment history - users and admins only
DROP POLICY IF EXISTS "Users can view own payment history" ON payment_history;
CREATE POLICY "Users can view own payment history" ON payment_history
  FOR SELECT USING (get_clerk_user_id() = user_id OR is_admin_user() OR is_service_role());

-- Law firms - users can manage their own firms, admins can see all
DROP POLICY IF EXISTS "Users can view own firm" ON law_firms;
DROP POLICY IF EXISTS "Users can insert own firm" ON law_firms;  
DROP POLICY IF EXISTS "Users can update own firm" ON law_firms;

CREATE POLICY "Users can view own firm" ON law_firms
  FOR SELECT USING (get_clerk_user_id() = user_id OR is_admin_user() OR is_service_role());

CREATE POLICY "Users can insert own firm" ON law_firms
  FOR INSERT WITH CHECK (get_clerk_user_id() = user_id OR is_service_role());

CREATE POLICY "Users can update own firm" ON law_firms
  FOR UPDATE USING (get_clerk_user_id() = user_id OR is_service_role());

-- Attorneys - public profiles but users can only edit their own
DROP POLICY IF EXISTS "Attorneys can view own profile" ON attorneys;
DROP POLICY IF EXISTS "Attorneys can update own profile" ON attorneys;

-- Public can view attorney profiles (for transparency)
CREATE POLICY "Attorney profiles are public" ON attorneys
  FOR SELECT USING (true);

-- Users can insert/update their own attorney profile
CREATE POLICY "Users can insert own attorney profile" ON attorneys
  FOR INSERT WITH CHECK (get_clerk_user_id() = user_id OR is_service_role());

CREATE POLICY "Users can update own attorney profile" ON attorneys
  FOR UPDATE USING (get_clerk_user_id() = user_id OR is_admin_user() OR is_service_role());

-- Step 6: Analytics and Tracking Policies
-- ========================================

-- Conversion tracking - users can see their own, admins see all
DROP POLICY IF EXISTS "Users can view own conversion data" ON conversion_tracking;
CREATE POLICY "Users can view own conversion data" ON conversion_tracking
  FOR SELECT USING (get_clerk_user_id() = user_id OR is_admin_user() OR is_service_role());

CREATE POLICY "System can insert conversion data" ON conversion_tracking
  FOR INSERT WITH CHECK (is_service_role());

-- Email send log - users can see their own, admins see all
DROP POLICY IF EXISTS "Users can view own email logs" ON email_send_log;
CREATE POLICY "Users can view own email logs" ON email_send_log
  FOR SELECT USING (get_clerk_user_id() = user_id OR is_admin_user() OR is_service_role());

CREATE POLICY "System can insert email logs" ON email_send_log
  FOR INSERT WITH CHECK (is_service_role());

-- Billing automations - users see their own, admins see all
DROP POLICY IF EXISTS "Users can view own billing automations" ON billing_automations;
CREATE POLICY "Users can view own billing automations" ON billing_automations
  FOR SELECT USING (get_clerk_user_id() = user_id OR is_admin_user() OR is_service_role());

CREATE POLICY "System can manage billing automations" ON billing_automations
  FOR ALL USING (is_service_role());

-- Search history - users see their own, admins see all for analytics
DROP POLICY IF EXISTS "Users can view own search history" ON search_history;
CREATE POLICY "Users can view own search history" ON search_history
  FOR SELECT USING (get_clerk_user_id() = user_id OR is_admin_user() OR is_service_role());

CREATE POLICY "System can insert search history" ON search_history
  FOR INSERT WITH CHECK (is_service_role());

-- Analytics events - admins only for privacy
CREATE POLICY "Admin access for analytics events" ON analytics_events
  FOR ALL USING (is_admin_user() OR is_service_role());

-- Step 7: Ensure Service Role Bypass for System Operations
-- ========================================

-- Create policy to allow service role full access to all tables
-- This ensures system operations (sync, migrations, etc.) continue to work

DO $$
DECLARE
    table_name TEXT;
    tables_to_update TEXT[] := ARRAY[
        'courts', 'judges', 'cases', 'users', 'attorneys', 'attorney_slots',
        'law_firms', 'advertisements', 'payment_history', 'revenue_tracking',
        'kpi_metrics', 'conversion_tracking', 'marketing_campaigns', 
        'campaign_prospects', 'email_sequences', 'email_sequence_steps',
        'email_send_log', 'admin_analytics', 'billing_automations',
        'user_bookmarks', 'user_preferences', 'user_activity',
        'user_saved_searches', 'user_notifications', 'search_history',
        'analytics_events', 'performance_metrics', 'subscriptions'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_to_update
    LOOP
        -- Create service role bypass policy if it doesn't exist
        BEGIN
            EXECUTE format('CREATE POLICY "Service role bypass" ON %I FOR ALL USING (is_service_role())', table_name);
        EXCEPTION WHEN duplicate_object THEN
            -- Policy already exists, skip
            NULL;
        END;
    END LOOP;
END $$;

-- Step 8: Create audit trail function
-- ========================================

-- Function to log data access for security monitoring
CREATE OR REPLACE FUNCTION log_data_access(
    table_name TEXT,
    operation TEXT,
    user_id TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO analytics_events (
        user_id,
        event_type,
        event_data,
        ip_address,
        created_at
    ) VALUES (
        COALESCE(user_id, get_clerk_user_id()),
        'data_access',
        json_build_object(
            'table', table_name,
            'operation', operation,
            'timestamp', NOW()
        ),
        inet_client_addr(),
        NOW()
    );
EXCEPTION WHEN OTHERS THEN
    -- Don't fail the main query if logging fails
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Test queries to verify RLS is working correctly

-- 1. Test public access to judges (should work)
-- SELECT COUNT(*) FROM judges;

-- 2. Test user bookmark access (should require auth)
-- SELECT * FROM user_bookmarks WHERE user_id = 'test-user-id';

-- 3. Test admin access to KPI metrics (should require admin role)
-- SELECT * FROM kpi_metrics LIMIT 1;

-- 4. Test service role bypass (should work for all tables)
-- This would be tested with service role credentials

-- ========================================
-- SETUP INSTRUCTIONS
-- ========================================

-- 1. Set admin emails in database:
-- ALTER DATABASE your_database_name SET app.admin_emails = 'admin1@example.com,admin2@example.com';

-- 2. Verify RLS is enabled on all tables:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND rowsecurity = true;

-- 3. Test with different user contexts:
-- - Anonymous user (should only access public data)
-- - Authenticated user (should access own data)
-- - Admin user (should access admin data)
-- - Service role (should bypass all restrictions)

COMMENT ON FUNCTION get_clerk_user_id() IS 'Returns the current Clerk user ID from JWT token';
COMMENT ON FUNCTION is_admin_user() IS 'Checks if current user is an admin based on email';
COMMENT ON FUNCTION is_service_role() IS 'Checks if current session is using service role';
COMMENT ON FUNCTION log_data_access(TEXT, TEXT, TEXT) IS 'Logs data access events for security monitoring';