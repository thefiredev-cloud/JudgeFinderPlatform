-- Add slug column to courts table for SEO-friendly URLs
-- This migration addresses the 404 error issue with court pages

-- Add slug column
ALTER TABLE courts 
ADD COLUMN slug VARCHAR(255);

-- Create a function to generate court slugs
CREATE OR REPLACE FUNCTION generate_court_slug(court_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRIM(court_name), 
          '[^a-zA-Z0-9\s]', '', 'g'  -- Remove special characters but keep spaces
        ), 
        '\s+', '-', 'g'              -- Replace spaces with hyphens
      ), 
      '-+', '-', 'g'                 -- Replace multiple hyphens with single
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for all existing courts
UPDATE courts 
SET slug = generate_court_slug(name)
WHERE slug IS NULL;

-- Create unique index on slug column for fast lookups
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_courts_slug 
ON courts(slug);

-- Add constraint to ensure slug is always present for new records
ALTER TABLE courts 
ADD CONSTRAINT courts_slug_not_null 
CHECK (slug IS NOT NULL AND slug != '');

-- Create trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION update_court_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update slug if name changed or slug is null
  IF (TG_OP = 'INSERT' AND NEW.slug IS NULL) OR 
     (TG_OP = 'UPDATE' AND (NEW.name != OLD.name OR NEW.slug IS NULL)) THEN
    NEW.slug = generate_court_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_court_slug
  BEFORE INSERT OR UPDATE ON courts
  FOR EACH ROW
  EXECUTE FUNCTION update_court_slug();

-- Handle any duplicate slugs that might exist
WITH duplicate_slugs AS (
  SELECT slug, COUNT(*) as count
  FROM courts 
  WHERE slug IS NOT NULL
  GROUP BY slug
  HAVING COUNT(*) > 1
)
UPDATE courts 
SET slug = slug || '-' || id
WHERE slug IN (SELECT slug FROM duplicate_slugs)
  AND id NOT IN (
    SELECT DISTINCT ON (slug) id 
    FROM courts 
    WHERE slug IN (SELECT slug FROM duplicate_slugs)
    ORDER BY slug, id
  );

-- Add comment for documentation
COMMENT ON COLUMN courts.slug IS 'SEO-friendly URL slug generated from court name, used for pretty URLs';