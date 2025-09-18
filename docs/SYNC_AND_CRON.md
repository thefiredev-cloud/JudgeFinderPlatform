# Data Sync & Cron Jobs

## Sync Systems
- Courts: `lib/sync/court-sync.ts` (batching, change detection, retry)
- Judges: `lib/sync/judge-sync.ts` (profiles, assignments, slugs)
- Decisions: `lib/sync/decision-sync.ts` (text extraction, feed to AI)
- Queue: `lib/sync/queue-manager.ts` (priorities, retry, metrics)

Typical usage:
```ts
await courtSyncManager.syncCourts({ batchSize: 20, jurisdiction: 'CA', forceRefresh: false })
```

## Cron Routes
- Daily: `app/api/cron/daily-sync/route.ts`
  - Twice daily judge/decision updates
  - Auth: `Authorization: Bearer ${CRON_SECRET}`
- Weekly: `app/api/cron/weekly-sync/route.ts`
  - Courts refresh, judge refresh, federal maintenance, decisions, cleanup
  - Staggered scheduling with backoff

## Admin & Health APIs
- Health: `GET /api/health`
- Sync status: `GET /api/admin/sync-status`
- Sync control: `POST /api/admin/sync-status` with header `x-api-key: ${SYNC_API_KEY}`

Actions supported by `POST /api/admin/sync-status`:
- `queue_job` (type: decision|judge|court)
- `cancel_jobs`
- `cleanup`
- `restart_queue`

