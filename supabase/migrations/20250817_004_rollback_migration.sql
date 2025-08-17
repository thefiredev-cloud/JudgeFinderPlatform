-- Migration Rollback: Remove CourtListener integration and judge-court positions
-- Version: 20250817_004_rollback
-- Description: Rollback script to undo all changes from migrations 001-003

-- WARNING: This will delete all judge-court position relationship data!
-- Use with caution in production environments

-- Drop judge_court_positions table and all related objects
DROP TRIGGER IF EXISTS trigger_judge_court_positions_updated_at ON judge_court_positions;
DROP FUNCTION IF EXISTS update_judge_court_positions_updated_at();
DROP TABLE IF EXISTS judge_court_positions CASCADE;

-- Remove indexes from previous migrations
DROP INDEX IF EXISTS idx_courts_courtlistener_id;
DROP INDEX IF EXISTS idx_judges_courtlistener_id;
DROP INDEX IF EXISTS idx_judges_jurisdiction;
DROP INDEX IF EXISTS idx_judge_court_positions_court_detail;
DROP INDEX IF EXISTS idx_judge_court_positions_judge_profile;
DROP INDEX IF EXISTS idx_active_positions_only;
DROP INDEX IF EXISTS idx_historical_positions;
DROP INDEX IF EXISTS idx_positions_by_type;
DROP INDEX IF EXISTS idx_judges_jurisdiction_active;
DROP INDEX IF EXISTS idx_courts_jurisdiction_type;
DROP INDEX IF EXISTS idx_court_judge_metadata;
DROP INDEX IF EXISTS idx_courtlistener_sync_courts;
DROP INDEX IF EXISTS idx_courtlistener_sync_judges;

-- Remove CourtListener fields from courts table
ALTER TABLE courts 
DROP COLUMN IF EXISTS courtlistener_id,
DROP COLUMN IF EXISTS courthouse_metadata;

-- Remove CourtListener fields from judges table
ALTER TABLE judges
DROP COLUMN IF EXISTS courtlistener_id,
DROP COLUMN IF EXISTS positions;