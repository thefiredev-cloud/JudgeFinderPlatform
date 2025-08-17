-- Migration: Add performance indexes for court-judge queries
-- Version: 20250817_003
-- Description: Adds specialized indexes for efficient querying of court detail pages and judge lookups

-- Index for court detail page queries (judges serving at a specific court)
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_court_detail 
    ON judge_court_positions(court_id, status, position_type, start_date DESC)
    WHERE status = 'active';

-- Index for judge profile queries (courts where judge has served)
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_judge_profile
    ON judge_court_positions(judge_id, start_date DESC, end_date DESC)
    INCLUDE (court_id, position_type, status);

-- Partial index for current active positions only
CREATE INDEX IF NOT EXISTS idx_active_positions_only
    ON judge_court_positions(judge_id, court_id, position_type)
    WHERE status = 'active' AND (end_date IS NULL OR end_date > CURRENT_DATE);

-- Index for historical position queries
CREATE INDEX IF NOT EXISTS idx_historical_positions
    ON judge_court_positions(court_id, start_date, end_date)
    WHERE end_date IS NOT NULL;

-- Index for position type filtering (Chief Judges, Senior Judges, etc.)
CREATE INDEX IF NOT EXISTS idx_positions_by_type
    ON judge_court_positions(position_type, court_id, status)
    WHERE position_type IN ('Chief Judge', 'Presiding Judge', 'Senior Judge');

-- Index for jurisdiction-based queries on judges
CREATE INDEX IF NOT EXISTS idx_judges_jurisdiction_active
    ON judges(jurisdiction, id)
    WHERE jurisdiction IS NOT NULL;

-- Index for courts by jurisdiction and type
CREATE INDEX IF NOT EXISTS idx_courts_jurisdiction_type
    ON courts(jurisdiction, type, id)
    WHERE jurisdiction IS NOT NULL;

-- Composite index for efficient court-judge lookups with metadata
CREATE INDEX IF NOT EXISTS idx_court_judge_metadata
    ON judge_court_positions(court_id, judge_id, status, metadata)
    WHERE metadata IS NOT NULL AND metadata != '{}'::jsonb;

-- Index for CourtListener synchronization queries
CREATE INDEX IF NOT EXISTS idx_courtlistener_sync_courts
    ON courts(courtlistener_id, updated_at)
    WHERE courtlistener_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_courtlistener_sync_judges
    ON judges(courtlistener_id, updated_at)
    WHERE courtlistener_id IS NOT NULL;

-- Add statistics for query optimization
ANALYZE judge_court_positions;
ANALYZE courts;
ANALYZE judges;