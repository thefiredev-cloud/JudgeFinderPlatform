# Environment Reference

This project validates environment variables at startup (see `lib/utils/env-validator.ts`). Below is a concise reference for required and optional variables and how they’re used.

## Required
- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL (frontend and server)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key (frontend)
- `SUPABASE_SERVICE_ROLE_KEY` – Supabase service role (server only)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` – Clerk publishable key (frontend)
- `CLERK_SECRET_KEY` – Clerk secret key (server)
- `COURTLISTENER_API_KEY` – CourtListener API token (server)
- `NEXT_PUBLIC_SITE_URL` – Public site URL (used for absolute links)

## Optional
- `GOOGLE_AI_API_KEY` – Gemini primary analytics
- `OPENAI_API_KEY` – OpenAI fallback analytics
- `UPSTASH_REDIS_REST_URL` – Upstash Redis (rate limiting)
- `UPSTASH_REDIS_REST_TOKEN` – Upstash Redis token
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` – Sentry error tracking
- `NODE_ENV` – `development|production|test`
- `CRON_SECRET` – Bearer token for cron routes
- `SYNC_API_KEY` – Admin header for `/api/admin/sync-status`

## Validation & Templates
- Runtime validation: `lib/utils/env-validator.ts`
- Generates `.env` template text: `generateEnvTemplate()`

## Local Workflow
1) Copy `.env.example` to `.env.local` and fill values.
2) For Netlify, you can pull env vars:
```
netlify link
netlify env:pull --json > .env.local
```

## Notes
- AI analytics are disabled without at least one of `GOOGLE_AI_API_KEY` or `OPENAI_API_KEY`.
- Rate limiting is disabled without Upstash vars (safe in local dev).
- Production should set Sentry DSN to capture errors.

