# Operations & Troubleshooting

## Monitoring
- Sentry: errors and performance (configure `SENTRY_DSN`)
- Health endpoint: `GET /api/health`
- Admin dashboard: `GET /api/admin/stats` (Clerk admin)
- Sync status: `GET /api/admin/sync-status`

## Queue Controls
- `POST /api/admin/sync-status` with header `x-api-key: ${SYNC_API_KEY}`
  - `queue_job` (type: decision|judge|court)
  - `cancel_jobs`
  - `cleanup`
  - `restart_queue`

## Common Issues
1) Analytics generation fails
   - Validate AI API keys and rate limits
   - Confirm decision documents exist for the judge
   - Check server logs and retry with smaller batches

2) Sync failures
   - Verify Supabase credentials and network access
   - Check CourtListener status
   - Tune `batchSize` and respect API limits

3) Performance issues
   - Monitor cache hit rates (Upstash)
   - Inspect DB query plans and indexes
   - Reduce concurrent jobs in queue manager

## Useful Debug Scripts
```
node scripts/debug-table-existence.js
npm run integrity:full
node scripts/test-courtlistener.js
```

## Deployment (Netlify)
- Connected repo with `@netlify/plugin-nextjs`
- Set env vars in Site settings → Environment
- `netlify deploy --prod` for manual production deploys

