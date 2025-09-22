-- Add docket_hash column for deduplicating case records across syncs
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS docket_hash TEXT;

-- Backfill docket_hash for existing rows using normalized case numbers + jurisdiction + judge
WITH normalized AS (
  SELECT
    id,
    md5(
      coalesce(regexp_replace(upper(case_number), '[^A-Z0-9]', '', 'g'), '') || '|' ||
      coalesce(upper(jurisdiction), '') || '|' ||
      coalesce(judge_id::text, '')
    ) AS hash_candidate,
    ROW_NUMBER() OVER (
      PARTITION BY coalesce(regexp_replace(upper(case_number), '[^A-Z0-9]', '', 'g'), '') || '|' ||
                   coalesce(upper(jurisdiction), '') || '|' ||
                   coalesce(judge_id::text, '')
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id
    ) AS row_rank
  FROM cases
  WHERE case_number IS NOT NULL
)
UPDATE cases
SET docket_hash = normalized.hash_candidate
FROM normalized
WHERE cases.id = normalized.id
  AND normalized.hash_candidate IS NOT NULL
  AND normalized.row_rank = 1;

-- Ensure duplicates beyond the first keep docket_hash null to avoid unique violations
WITH duplicates AS (
  SELECT id
  FROM normalized
  WHERE row_rank > 1
)
UPDATE cases
SET docket_hash = NULL
WHERE id IN (SELECT id FROM duplicates);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cases_docket_hash_unique
  ON cases (docket_hash)
  WHERE docket_hash IS NOT NULL;

COMMENT ON COLUMN cases.docket_hash IS 'Stable hash of case number + jurisdiction + judge for deduplication.';
