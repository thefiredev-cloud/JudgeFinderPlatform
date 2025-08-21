-- SQL script to add court slug column
-- Run this manually in Supabase SQL Editor

-- Add the slug column
ALTER TABLE courts ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_courts_slug ON courts(slug);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'courts' AND column_name = 'slug';