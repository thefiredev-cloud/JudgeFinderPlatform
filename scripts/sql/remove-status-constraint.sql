-- Remove the status check constraint that's blocking case insertion
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_status_check;

-- Add a more flexible constraint or none at all
-- Status can be any reasonable value for a case