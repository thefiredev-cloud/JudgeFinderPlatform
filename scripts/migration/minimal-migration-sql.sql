-- Minimal Migration: Add missing CourtListener fields
-- Execute these statements in your Supabase SQL Editor

-- Add missing courthouse_metadata column to courts table
ALTER TABLE courts ADD COLUMN IF NOT EXISTS courthouse_metadata JSONB DEFAULT '{}'::jsonb;

-- Add missing positions column to judges table  
ALTER TABLE judges ADD COLUMN IF NOT EXISTS positions JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN courts.courthouse_metadata IS 'JSON metadata from CourtListener including sync info, position data, and API response details';
COMMENT ON COLUMN judges.positions IS 'JSON array of position history including court assignments, titles, and tenure dates';

-- Verify the additions
SELECT 'courthouse_metadata column added to courts table' as status;
SELECT 'positions column added to judges table' as status;