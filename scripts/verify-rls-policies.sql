-- ========================================
-- RLS POLICY VERIFICATION SCRIPT
-- JudgeFinder Platform - Row Level Security Testing
-- ========================================

-- This script verifies that RLS policies are working correctly
-- Run these queries with different user contexts to test security

-- ========================================
-- STEP 1: VERIFY RLS IS ENABLED
-- ========================================

-- Check which tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS Enabled ✓'
        ELSE 'RLS Disabled ❌'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ========================================
-- STEP 2: LIST ALL RLS POLICIES
-- ========================================

-- Show all RLS policies and their definitions
SELECT 
    t.tablename,
    p.policyname,
    p.cmd as operation,
    p.qual as using_clause,
    p.with_check as check_clause,
    CASE 
        WHEN p.cmd = 'r' THEN 'SELECT'
        WHEN p.cmd = 'a' THEN 'INSERT' 
        WHEN p.cmd = 'w' THEN 'UPDATE'
        WHEN p.cmd = 'd' THEN 'DELETE'
        WHEN p.cmd = '*' THEN 'ALL'
        ELSE p.cmd
    END as operation_type
FROM pg_policies p
JOIN pg_tables t ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
ORDER BY t.tablename, p.policyname;

-- ========================================
-- STEP 3: TEST PUBLIC ACCESS
-- ========================================

-- These queries should work for everyone (public access)
-- Test with anonymous user context

-- Test public judge access
SELECT 
    'judges' as table_name,
    COUNT(*) as total_records,
    'Should be accessible to everyone' as expected_result
FROM judges;

-- Test public court access  
SELECT 
    'courts' as table_name,
    COUNT(*) as total_records,
    'Should be accessible to everyone' as expected_result
FROM courts;

-- Test public case access
SELECT 
    'cases' as table_name,
    COUNT(*) as total_records,
    'Should be accessible to everyone' as expected_result
FROM cases;

-- Test public attorney profiles
SELECT 
    'attorneys' as table_name,
    COUNT(*) as total_records,
    'Should be accessible to everyone' as expected_result
FROM attorneys;

-- ========================================
-- STEP 4: TEST USER-SCOPED ACCESS  
-- ========================================

-- These queries should only return data for the authenticated user
-- Test with authenticated user context (replace 'test-user-id' with actual Clerk user ID)

-- Test user bookmarks (should only see own bookmarks)
SELECT 
    'user_bookmarks' as table_name,
    COUNT(*) as user_records,
    'Should only see own bookmarks' as expected_result
FROM user_bookmarks 
WHERE user_id = 'test-user-id';

-- Test user preferences (should only see own preferences)
SELECT 
    'user_preferences' as table_name,
    COUNT(*) as user_records,
    'Should only see own preferences' as expected_result
FROM user_preferences
WHERE user_id = 'test-user-id';

-- Test user activity (should only see own activity)
SELECT 
    'user_activity' as table_name,
    COUNT(*) as user_records,
    'Should only see own activity' as expected_result
FROM user_activity
WHERE user_id = 'test-user-id';

-- ========================================
-- STEP 5: TEST ADMIN ACCESS
-- ========================================

-- These queries should only work for admin users
-- Test with admin user context

-- Test KPI metrics access (admin only)
BEGIN;
-- This should work for admins, fail for regular users
SELECT 
    'kpi_metrics' as table_name,
    COUNT(*) as admin_records,
    'Should only work for admins' as expected_result
FROM kpi_metrics;
ROLLBACK;

-- Test marketing campaigns access (admin only)
BEGIN;
SELECT 
    'marketing_campaigns' as table_name,
    COUNT(*) as admin_records,
    'Should only work for admins' as expected_result
FROM marketing_campaigns;
ROLLBACK;

-- Test admin analytics access (admin only)
BEGIN;
SELECT 
    'admin_analytics' as table_name,
    COUNT(*) as admin_records,
    'Should only work for admins' as expected_result
FROM admin_analytics;
ROLLBACK;

-- ========================================
-- STEP 6: TEST FUNCTION SECURITY
-- ========================================

-- Test utility functions work correctly
SELECT 
    'get_clerk_user_id()' as function_name,
    get_clerk_user_id() as result,
    'Should return current user ID or NULL' as expected_result;

SELECT 
    'is_admin_user()' as function_name,
    is_admin_user() as result,
    'Should return true/false based on user email' as expected_result;

SELECT 
    'is_service_role()' as function_name,
    is_service_role() as result,
    'Should return true only for service role' as expected_result;

-- ========================================
-- STEP 7: TEST INSERT/UPDATE PERMISSIONS
-- ========================================

-- Test that users can only modify their own data
-- (These should be run in a transaction and rolled back)

-- Test bookmark creation (should only work for own user_id)
BEGIN;
INSERT INTO user_bookmarks (user_id, judge_id) 
VALUES ('test-user-id', (SELECT id FROM judges LIMIT 1));
-- Should succeed if test-user-id matches authenticated user
ROLLBACK;

-- Test preference update (should only work for own user_id)  
BEGIN;
UPDATE user_preferences 
SET default_jurisdiction = 'NY'
WHERE user_id = 'test-user-id';
-- Should succeed if test-user-id matches authenticated user
ROLLBACK;

-- ========================================
-- STEP 8: PERFORMANCE IMPACT CHECK
-- ========================================

-- Check if RLS policies are using indexes effectively
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM user_bookmarks 
WHERE user_id = 'test-user-id';

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM judges 
WHERE name ILIKE '%smith%';

-- ========================================
-- STEP 9: SECURITY AUDIT REPORT
-- ========================================

-- Generate a comprehensive security report
WITH rls_status AS (
  SELECT 
    tablename,
    rowsecurity,
    COUNT(p.policyname) as policy_count
  FROM pg_tables t
  LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = 'public'
  WHERE t.schemaname = 'public'
  GROUP BY t.tablename, t.rowsecurity
),
table_categories AS (
  SELECT 
    tablename,
    CASE 
      WHEN tablename IN ('judges', 'courts', 'cases', 'attorneys') THEN 'Public Data'
      WHEN tablename LIKE 'user_%' OR tablename = 'user_bookmarks' THEN 'User Data'
      WHEN tablename IN ('kpi_metrics', 'admin_analytics', 'marketing_campaigns') THEN 'Admin Data'
      WHEN tablename IN ('revenue_tracking', 'payment_history', 'advertisements') THEN 'Financial Data'
      ELSE 'System Data'
    END as data_category
  FROM pg_tables 
  WHERE schemaname = 'public'
)
SELECT 
  tc.data_category,
  rs.tablename,
  CASE 
    WHEN rs.rowsecurity THEN 'Enabled ✓'
    ELSE 'Disabled ❌'
  END as rls_status,
  rs.policy_count as policies,
  CASE
    WHEN rs.rowsecurity AND rs.policy_count > 0 THEN 'Secure ✓'
    WHEN rs.rowsecurity AND rs.policy_count = 0 THEN 'RLS enabled but no policies ⚠️'
    WHEN NOT rs.rowsecurity AND tc.data_category = 'Public Data' THEN 'OK for public data'
    ELSE 'Insecure ❌'
  END as security_status
FROM rls_status rs
JOIN table_categories tc ON tc.tablename = rs.tablename
ORDER BY tc.data_category, rs.tablename;

-- ========================================
-- TESTING INSTRUCTIONS
-- ========================================

/*
To properly test these RLS policies, run this script in different contexts:

1. ANONYMOUS USER TEST:
   - Connect to database without authentication
   - Should only be able to access public tables (judges, courts, cases)
   - Should get permission denied for user/admin tables

2. AUTHENTICATED USER TEST:
   - Connect with valid Clerk JWT token
   - Replace 'test-user-id' with actual user ID from token
   - Should access own user data but not other users' data

3. ADMIN USER TEST:
   - Connect with admin user's JWT token
   - Should access all admin tables and functions
   - Verify is_admin_user() returns true

4. SERVICE ROLE TEST:
   - Connect with service role credentials
   - Should bypass all RLS restrictions
   - All queries should work regardless of content

5. PERFORMANCE TEST:
   - Run EXPLAIN ANALYZE on filtered queries
   - Verify indexes are being used efficiently
   - Check for any performance degradation

EXPECTED RESULTS:
- Public data: Always accessible
- User data: Only accessible by owner or admin
- Admin data: Only accessible by admin or service role
- Financial data: Only accessible by owner, admin, or service role
- No unauthorized data leakage between users
*/