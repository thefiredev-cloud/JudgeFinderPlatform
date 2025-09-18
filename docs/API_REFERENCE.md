# API Reference (Core Routes)

All paths are relative to the site root. For production, set `CRON_SECRET` and `SYNC_API_KEY` to protect admin routes.

## Health
- `GET /api/health`
  - Returns status, uptime, memory, and DB connectivity metrics.
  - No auth required.

## Admin: Sync Status
- `GET /api/admin/sync-status`
  - Header: `x-api-key: ${SYNC_API_KEY}`
  - Returns:
    - `health`: overall status and uptime
    - `queue`: stats, status rows, backlog
    - `performance`: daily/weekly success rates and avg durations
    - `freshness`: last judges sync and newest decision timestamps
    - `recent_logs`: recent sync runs
    - `sync_breakdown`: dashboard rows

- `POST /api/admin/sync-status`
  - Header: `x-api-key: ${SYNC_API_KEY}`
  - Body: `{ action: 'queue_job'|'cancel_jobs'|'cleanup'|'restart_queue', type?: 'decision'|'judge'|'court', options?: any, priority?: number }`

## Admin: Stats (requires Clerk admin)
- `GET /api/admin/stats`
  - Auth: Clerk session, admin user
  - Returns counts for judges, courts, users, mock activity stats, and derived system health.

## Cron Entrypoints
- `POST /api/cron/daily-sync`
  - Header: `Authorization: Bearer ${CRON_SECRET}`
- `POST /api/cron/weekly-sync`
  - Header: `Authorization: Bearer ${CRON_SECRET}`

