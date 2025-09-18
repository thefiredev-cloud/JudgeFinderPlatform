# Security & Access Control

## Middleware
- Path: `middleware.ts`
- Sets strict security headers (X-Frame-Options, X-Content-Type-Options, XSS, Referrer-Policy).
- CSP configured with minimal origins for Supabase, Clerk, analytics, Sentry, and AI endpoints.
- HSTS enabled in production.
- Caches API responses with `no-cache`.

## Authentication
- Clerk used for protected routes (dashboard, admin, etc.).
- Admin API `/api/admin/stats` requires a Clerk admin session.

## Admin Secrets
- `CRON_SECRET` – sent as `Authorization: Bearer ${CRON_SECRET}` to cron routes.
- `SYNC_API_KEY` – required as `x-api-key` for `/api/admin/sync-status` GET/POST.

## Rate Limiting
- Upstash Redis keys (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) enable rate limiting and help mitigate abuse.
- If not set, rate limiting is disabled (safe in local dev but not recommended for prod).

## Error Monitoring
- Sentry DSN recommended in production to capture errors and performance data.

