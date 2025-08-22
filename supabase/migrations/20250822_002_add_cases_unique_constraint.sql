-- Fix Cases Table Unique Constraint
-- Run this migration to add the missing unique constraint

-- First drop the constraint if it exists
ALTER TABLE cases 
DROP CONSTRAINT IF EXISTS cases_judge_case_unique;

-- Add the unique constraint
ALTER TABLE cases 
ADD CONSTRAINT cases_judge_case_unique 
UNIQUE (judge_id, case_number);

-- Verify the constraint was added
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE 
    tc.table_name = 'cases' 
    AND tc.constraint_type = 'UNIQUE';
