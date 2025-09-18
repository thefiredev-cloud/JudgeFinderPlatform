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

## Phase 4: Final Validation (Day 5)
```
npm run integrity:full
npm run validate:relationships
```
- E2E checks: judge search, comparison, bias analysis UI
- Performance: <3s page loads, rate limiting verified

## Success Criteria
- Judges and courts populated, analytics available
- No build errors, all pages routable
- Performance and monitoring green

