-- Migration: Add slug column to judges table for SEO optimization
-- Version: 20250820_001
-- Description: Adds SEO-friendly slug column and populates it for all judges

-- Add slug column to judges table
ALTER TABLE judges 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_judges_slug ON judges(slug) WHERE slug IS NOT NULL;

-- Add unique constraint for slug (allow nulls for now during population)
ALTER TABLE judges 
ADD CONSTRAINT IF NOT EXISTS judges_slug_unique UNIQUE(slug) DEFERRABLE INITIALLY DEFERRED;

-- Function to generate slug from judge name
CREATE OR REPLACE FUNCTION generate_judge_slug(judge_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
    slug_exists BOOLEAN;
BEGIN
    -- Clean the name and create base slug
    base_slug := lower(trim(judge_name));
    
    -- Remove common prefixes
    base_slug := regexp_replace(base_slug, '^(judge|justice|the honorable|hon\.?)\s+', '', 'gi');
    
    -- Replace spaces and special characters with hyphens
    base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
    
    -- Remove leading/trailing hyphens and multiple consecutive hyphens
    base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    
    -- Start with base slug
    final_slug := base_slug;
    
    -- Check if slug already exists and increment if needed
    LOOP
        SELECT EXISTS(SELECT 1 FROM judges WHERE slug = final_slug) INTO slug_exists;
        
        IF NOT slug_exists THEN
            EXIT;
        END IF;
        
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Update all judges with slugs
UPDATE judges 
SET slug = generate_judge_slug(name)
WHERE slug IS NULL AND name IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN judges.slug IS 'SEO-friendly URL slug generated from judge name for optimal search engine indexing';

-- Verify all judges have slugs
DO $$
DECLARE
    null_slug_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_slug_count FROM judges WHERE slug IS NULL;
    
    IF null_slug_count > 0 THEN
        RAISE WARNING 'Found % judges without slugs - manual intervention may be required', null_slug_count;
    ELSE
        RAISE NOTICE 'Successfully generated slugs for all judges';
    END IF;
END;
$$;