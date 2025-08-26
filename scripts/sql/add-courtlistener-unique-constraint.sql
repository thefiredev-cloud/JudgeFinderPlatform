-- Add unique constraint for courtlistener_id in cases table
-- This allows us to use ON CONFLICT for upserts when syncing from CourtListener

-- First, remove any duplicate courtlistener_id entries if they exist
DELETE FROM cases 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM cases 
    WHERE courtlistener_id IS NOT NULL 
    GROUP BY courtlistener_id
);

-- Add unique constraint on courtlistener_id (excluding NULL values)
CREATE UNIQUE INDEX idx_cases_courtlistener_id_unique 
ON cases(courtlistener_id) 
WHERE courtlistener_id IS NOT NULL;

-- Also add a regular index for performance
CREATE INDEX idx_cases_courtlistener_id ON cases(courtlistener_id);

-- Add decision_date index for better query performance
CREATE INDEX idx_cases_decision_date ON cases(decision_date);

COMMENT ON INDEX idx_cases_courtlistener_id_unique IS 'Unique constraint for CourtListener ID to enable upserts';