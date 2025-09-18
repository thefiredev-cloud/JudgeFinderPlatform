-- Add source URL column to cases for storing CourtListener links
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS source_url TEXT;

COMMENT ON COLUMN cases.source_url IS 'Canonical source URL for the case or court filing.';
