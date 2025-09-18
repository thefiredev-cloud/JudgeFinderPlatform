# Launch Plan (5 Days)

This plan consolidates the 5‑day launch strategy referenced in README and agents docs.

## Phase 1: Data Population (Days 1–2)
Goals: all CA judges populated with recent decisions and analytics.
```
npm run sync:judges
npm run sync:courts
npm run sync:decisions
npm run analytics:generate
npm run bias:analyze
```

## Phase 2: Critical Fixes (Day 3)
- Resolve build/deploy errors
- Ensure auth keys set (Clerk)
- Add missing pages (admin/login/dashboard)
- Add basic API tests

## Phase 3: Production Setup (Day 4)
- Provision Supabase (prod), Upstash, Sentry
- Configure Netlify env vars and domain
- Deploy and smoke test
- Flag launch admins: `update app_users set is_admin = true where email in ('admin@example.com');`

## Phase 4: Final Validation (Day 5)
```
npm run integrity:full
npm run validate:relationships
```
- E2E checks: judge search, comparison, bias analysis UI
- Performance: <3s page loads, rate limiting verified
- Check `/admin` ops dashboard for queue health + CourtListener metrics (`external_api` section)
- Exercise cron webhooks with `curl -H "x-api-key: $CRON_SECRET" https://your-site/api/cron/daily-sync`

## Success Criteria
- Judges and courts populated, analytics available
- No build errors, all pages routable
- Performance and monitoring green

## Automation & Monitoring
- Schedule Netlify/Upstash cron calls to `/api/cron/daily-sync` (2x/day) and `/api/cron/weekly-sync` (weekly) using `CRON_SECRET`
- Review `performance_metrics` table for `cron_*` rows to confirm run times
- Admin ops dashboard (`/admin`) surfaces CourtListener fetch failures and circuit-breaker counts
