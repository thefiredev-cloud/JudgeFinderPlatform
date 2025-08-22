-- Add jurisdiction column to cases table
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS jurisdiction TEXT DEFAULT 'CA';

-- Update existing records to have 'CA' as jurisdiction
UPDATE cases 
SET jurisdiction = 'CA' 
WHERE jurisdiction IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_cases_jurisdiction ON cases(jurisdiction);

-- Add comment for documentation
COMMENT ON COLUMN cases.jurisdiction IS 'Jurisdiction code for the case (e.g., CA for California)';