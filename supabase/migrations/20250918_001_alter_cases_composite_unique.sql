-- Ensure composite uniqueness for cases across jurisdictions
-- Drop old unique constraint on case_number alone (if exists)
ALTER TABLE cases
DROP CONSTRAINT IF EXISTS cases_case_number_key;

-- Add composite unique constraint on (case_number, jurisdiction)
ALTER TABLE cases
ADD CONSTRAINT cases_case_number_jurisdiction_key UNIQUE (case_number, jurisdiction);

-- Helpful index for lookups by (judge_id, case_number) remains handled via query planner
-- Ensure jurisdiction column exists (no-op if already added by prior migration)
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS jurisdiction TEXT;

-- Ensure index on jurisdiction to support common filters
CREATE INDEX IF NOT EXISTS idx_cases_jurisdiction ON cases (jurisdiction);

COMMENT ON CONSTRAINT cases_case_number_jurisdiction_key ON cases IS 'Enforces uniqueness of case numbers within a jurisdiction.';

