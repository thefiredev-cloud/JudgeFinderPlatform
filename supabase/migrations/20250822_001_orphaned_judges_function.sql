-- Create function to find orphaned judges efficiently
-- This avoids the URI too large error by using SQL JOIN instead of large IN clauses

CREATE OR REPLACE FUNCTION find_orphaned_judges()
RETURNS TABLE (
    id UUID,
    name TEXT,
    court_id UUID
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT j.id, j.name, j.court_id
    FROM judges j
    LEFT JOIN courts c ON j.court_id = c.id
    WHERE j.court_id IS NOT NULL 
    AND c.id IS NULL;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_orphaned_judges() TO authenticated;
GRANT EXECUTE ON FUNCTION find_orphaned_judges() TO anon;