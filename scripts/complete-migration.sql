-- Complete Database Migration Script
-- Generated: 2025-08-17T19:55:12.879Z
-- Execute this entire script in Supabase SQL Editor


-- Migration: 20250817_001_add_courtlistener_fields.sql
-- File: supabase/migrations/20250817_001_add_courtlistener_fields.sql
-- Migration: Add CourtListener mapping fields and metadata
-- Version: 20250817_001
-- Description: Adds CourtListener ID fields and metadata columns to support external data integration

-- Add CourtListener mapping fields to courts table
ALTER TABLE courts 
ADD COLUMN IF NOT EXISTS courtlistener_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS courthouse_metadata JSONB DEFAULT '{}'::jsonb;

-- Add CourtListener mapping fields to judges table  
ALTER TABLE judges
ADD COLUMN IF NOT EXISTS courtlistener_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS positions JSONB DEFAULT '[]'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courts_courtlistener_id ON courts(courtlistener_id) WHERE courtlistener_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_judges_courtlistener_id ON judges(courtlistener_id) WHERE courtlistener_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_judges_jurisdiction ON judges(jurisdiction);

-- Add constraints for data integrity
ALTER TABLE courts 
ADD CONSTRAINT IF NOT EXISTS courts_courtlistener_id_unique UNIQUE(courtlistener_id);

ALTER TABLE judges
ADD CONSTRAINT IF NOT EXISTS judges_courtlistener_id_unique UNIQUE(courtlistener_id);

-- Add comments for documentation
COMMENT ON COLUMN courts.courtlistener_id IS 'External ID from CourtListener API for data synchronization';
COMMENT ON COLUMN courts.courthouse_metadata IS 'JSON metadata from CourtListener including sync info, position data, and API response details';
COMMENT ON COLUMN judges.courtlistener_id IS 'External ID from CourtListener API for data synchronization';
COMMENT ON COLUMN judges.positions IS 'JSON array of position history including court assignments, titles, and tenure dates';


-- Migration: 20250817_002_create_judge_court_positions.sql
-- File: supabase/migrations/20250817_002_create_judge_court_positions.sql
-- Migration: Create judge-court positions junction table
-- Version: 20250817_002
-- Description: Creates many-to-many relationship table for judge court appointments with position metadata

-- Create judge_court_positions table for many-to-many relationships
CREATE TABLE IF NOT EXISTS judge_court_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judge_id UUID NOT NULL,
    court_id UUID NOT NULL,
    position_type VARCHAR(100) NOT NULL DEFAULT 'Judge',
    appointment_date DATE,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_judge_court_positions_judge_id 
        FOREIGN KEY (judge_id) REFERENCES judges(id) ON DELETE CASCADE,
    CONSTRAINT fk_judge_court_positions_court_id 
        FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE,
    
    -- Ensure unique active positions per judge-court combination
    CONSTRAINT unique_active_judge_court_position 
        UNIQUE(judge_id, court_id, status, position_type) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_judge_id ON judge_court_positions(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_court_id ON judge_court_positions(court_id);
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_status ON judge_court_positions(status);
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_dates ON judge_court_positions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_type ON judge_court_positions(position_type);

-- Composite index for efficient queries
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_lookup 
    ON judge_court_positions(judge_id, court_id, status, start_date DESC);

-- Add check constraints for data integrity
ALTER TABLE judge_court_positions 
ADD CONSTRAINT check_position_dates 
    CHECK (
        (start_date IS NULL OR end_date IS NULL OR start_date <= end_date) AND
        (appointment_date IS NULL OR start_date IS NULL OR appointment_date <= start_date)
    );

ALTER TABLE judge_court_positions
ADD CONSTRAINT check_valid_status
    CHECK (status IN ('active', 'inactive', 'retired', 'resigned', 'transferred', 'deceased'));

ALTER TABLE judge_court_positions
ADD CONSTRAINT check_valid_position_type
    CHECK (position_type IN (
        'Judge', 'Chief Judge', 'Presiding Judge', 'Associate Judge', 
        'Senior Judge', 'Retired Judge', 'Acting Judge', 'Pro Tem Judge',
        'Magistrate Judge', 'Administrative Judge', 'Deputy Judge'
    ));

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_judge_court_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_judge_court_positions_updated_at
    BEFORE UPDATE ON judge_court_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_judge_court_positions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE judge_court_positions IS 'Junction table tracking judge appointments and positions across different courts with historical data';
COMMENT ON COLUMN judge_court_positions.position_type IS 'Type of judicial position (Judge, Chief Judge, Senior Judge, etc.)';
COMMENT ON COLUMN judge_court_positions.appointment_date IS 'Date when judge was officially appointed to this position';
COMMENT ON COLUMN judge_court_positions.start_date IS 'Date when judge began serving in this position';
COMMENT ON COLUMN judge_court_positions.end_date IS 'Date when judge ended service in this position (NULL for current positions)';
COMMENT ON COLUMN judge_court_positions.status IS 'Current status of the position (active, inactive, retired, etc.)';
COMMENT ON COLUMN judge_court_positions.metadata IS 'Additional position metadata including CourtListener data, appointment details, etc.';


-- Migration: 20250817_003_add_performance_indexes.sql
-- File: supabase/migrations/20250817_003_add_performance_indexes.sql
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

