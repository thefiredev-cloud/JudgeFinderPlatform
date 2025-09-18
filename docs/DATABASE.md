# Database & Migrations

Supabase Postgres stores core entities (judges, courts, cases, assignments, logs). SQL migrations live in `supabase/migrations/`.

## Migrations
- Location: `supabase/migrations/`
- Apply using your preferred workflow (e.g., Supabase SQL editor, CI, or the Supabase CLI).
- Example files:
  - `20250822_003_add_jurisdiction_column.sql` – adds `cases.jurisdiction` with default `CA`, index, and comment.
  - `20250821_002_add_rpc_function.sql` – example RPC `get_top_courts_by_cases(jurisdiction_filter, limit_count)`.
  - `20250817_003_add_performance_indexes.sql` – performance indexes.

## Example: Jurisdiction Column
```
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS jurisdiction TEXT DEFAULT 'CA';

UPDATE cases SET jurisdiction = 'CA' WHERE jurisdiction IS NULL;
CREATE INDEX IF NOT EXISTS idx_cases_jurisdiction ON cases(jurisdiction);
COMMENT ON COLUMN cases.jurisdiction IS 'Jurisdiction code (e.g., CA)';
```

## Helpful Tables & Views
- `sync_logs` – sync job history and durations
- `sync_dashboard` – breakdown for dashboards
- `queue_status` – view of queue state
- RPC: `get_sync_health()` (used in admin status)

## Local Tips
- Keep migrations idempotent where possible (`IF NOT EXISTS`).
- Include comments on new columns for clarity.
- For large backfills, add indexes after data loads to improve performance.

