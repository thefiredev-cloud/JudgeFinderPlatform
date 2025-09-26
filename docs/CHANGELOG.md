## 2025-09-26 – Pre-launch Updates

### Summary
- Environment and documentation refreshed: `.env.example`, `docs/ENVIRONMENT.md`, `docs/SETUP.md`, `docs/COMMANDS.md`, `docs/ARCHITECTURE.md`.
- Authentication and Supabase hardening: updates to `lib/auth/safe-auth.ts`, `lib/supabase/server.ts`; new service role client `lib/supabase/service-role.ts`; new migration `supabase/migrations/20251018_service_role_access.sql`.
- API reliability improvements:
  - Auth endpoints: `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`
  - Judge analytics: `app/api/judges/[id]/analytics/route.ts`, `app/api/judges/[id]/bias-analysis/route.ts`
  - Report issue: `app/api/report-profile-issue/route.ts`
  - Sync routes: `app/api/sync/courts/route.ts`, `app/api/sync/decisions/route.ts`, `app/api/sync/judges/route.ts`
- CourtListener & security: improved `lib/courtlistener/client.ts`; refined rate limiting in `lib/security/rate-limit.ts`; middleware updates in `middleware.ts`.
- Sync & scripts: updated `scripts/batch-generate-analytics.js`, `scripts/sync-judges-manual.js`; added `scripts/sync-courtlistener-judges.js`.
- UI & layout: updates in `app/layout.tsx`, `app/page.tsx`, `app/judges/*`; new `components/judges/AnalyticsSlidersShell.tsx`.
- Robots & hosting: replaced static `app/robots.txt` with dynamic `app/robots.ts`; updated `netlify.toml`.

### Notes
- Ensure `GOOGLE_AI_API_KEY`, `OPENAI_API_KEY`, `COURTLISTENER_API_KEY`, Supabase keys, and Upstash Redis keys are configured in production.
- After migration `20251018_service_role_access.sql`, verify RLS policies allow required service-role operations.


