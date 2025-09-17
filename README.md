# JudgeFinder Platform

AI-powered judicial transparency platform providing real-time analytics and bias detection across California's courts.

### Launch status: 5 Days to Production
See `LAUNCH_PLAN.md` for the full deployment strategy.

## Quick Launch Commands
```bash
# Generate AI analytics for all judges (Day 1-2)
npm run launch:analytics

# Run complete data sync (Day 1)
npm run launch:data

# Validate all systems (Day 5)
npm run launch:validate
```

## Overview

JudgeFinder delivers data-driven insights into judicial patterns using AI analysis and automated data ingestion from official sources.

- **AI Analytics**: Gemini 1.5 Flash primary, GPT-4o-mini fallback
- **Real-time Sync**: Daily and weekly automated jobs with retries and queueing
- **Coverage**: California courts and judges with decision documents

## Architecture & Tech Stack

- **Framework**: Next.js 15 + TypeScript
- **Database**: Supabase Postgres
- **Auth**: Clerk
- **Cache/Rate limit**: Upstash Redis
- **Hosting**: Netlify (`@netlify/plugin-nextjs`)
- **Error Monitoring**: Sentry

## Environment Variables
```bash
# AI Services
GOOGLE_AI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_fallback_key

# External APIs
COURTLISTENER_API_KEY=your_courtlistener_key

# Automation
CRON_SECRET=secure_cron_token
SYNC_API_KEY=manual_sync_trigger_key

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Rate Limiting / Cache
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Optional
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app
```

Tip: If deploying on Netlify, prefer syncing local env with:
```bash
netlify link             # one-time, select the site
netlify env:pull --json > .env.local
# Or: netlify env:list --json
```

## Getting Started (Local)
```bash
# Install dependencies
npm install

# Create .env.local and fill with the variables above

# Start dev server
npm run dev
```
App runs at `http://localhost:3005`.

## Data Sync & Analytics

Scripts are designed for incremental, resumable syncs with retries and logging to `sync_logs`.

```bash
# Manual syncs
npm run sync:courts
npm run sync:judges
npm run sync:decisions

# Batch generate analytics
npm run analytics:generate

# Check data status (requires Supabase env in .env.local)
npm run data:status
```

Admin endpoints (protected via `SYNC_API_KEY` header in production):
- `GET /api/admin/sync-status` – queue health, recent logs, freshness
- `POST /api/admin/sync-status` – queue actions (`queue_job`, `cancel_jobs`, `cleanup`, `restart_queue`)
- `POST /api/admin/sync` – admin-triggered sync (Clerk admin auth)

Health:
- `GET /api/health` – basic health check

## Scheduled Jobs

Weekly cron (`app/api/cron/weekly-sync/route.ts`):
- Queues: courts (immediate), judges (T+30m), federal judges (T+45m), decisions (T+60m), cleanup (T+120m)
- Starts processing via queue manager with backoff/retries

Daily cron (`app/api/cron/daily-sync/route.ts`):
- Twice daily judge/decision updates (see file for schedule)

## Project Structure

```
app/                 # Next.js App Router (APIs, pages)
components/          # UI and feature components
lib/                 # ai/, supabase/, sync/, utils/
scripts/             # Node automation scripts
supabase/            # SQL migrations and config
```

## Netlify Deployment (Recommended)

1) Connect repository to Netlify (UI) and set env vars in Site Settings → Environment

2) Build config is in `netlify.toml` (Node 18, Next plugin). Deploys on push to `main`.

3) Secure cron and admin endpoints by setting `CRON_SECRET` and `SYNC_API_KEY`.

4) After deploy, validate:
```bash
# Health
curl -s https://<site>/api/health | jq

# Sync status (requires header)
curl -s -H "x-api-key: $SYNC_API_KEY" https://<site>/api/admin/sync-status | jq
```

## Troubleshooting

- Missing data locally: ensure `.env.local` includes Supabase URL and keys
- CourtListener failures: verify `COURTLISTENER_API_KEY` and API availability
- Queue stuck: `POST /api/admin/sync-status { action: 'restart_queue' }` with `x-api-key`
- Rate limits: scripts include delays; reduce `batchSize` in options

## License

Proprietary. All rights reserved.

— Built for judicial transparency.