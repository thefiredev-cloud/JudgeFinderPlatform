-- Disable judge ad slots beyond allowed rotations and enforce inventory constraints

BEGIN;

-- Set judge positions greater than 2 to maintenance so they no longer appear as inventory
UPDATE ad_spots
SET status = 'maintenance'
WHERE entity_type = 'judge'
  AND position > 2;

-- Add a check constraint to prevent future inserts beyond two rotations for judges
ALTER TABLE ad_spots
  DROP CONSTRAINT IF EXISTS ad_spots_position_check,
  ADD CONSTRAINT ad_spots_position_check
    CHECK (
      position BETWEEN 1 AND 3
      AND (
        entity_type <> 'judge'
        OR position <= 2
      )
    );

COMMIT;
