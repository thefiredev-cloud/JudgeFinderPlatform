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