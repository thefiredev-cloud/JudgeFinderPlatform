# Setup & Run

## Prerequisites
- Node.js: `20.x` for local dev (`.nvmrc` is 20). Netlify build uses Node 18 (set via `netlify.toml`).
- npm: v9+
- Supabase project and credentials
- Optional: Netlify CLI (`npm i -g netlify-cli`)

## Environment
Create `.env.local` using the keys below. In production, set these in your deploy platform (e.g., Netlify Site settings → Environment).

```
# AI Services
GOOGLE_AI_API_KEY=
OPENAI_API_KEY=

# External APIs
COURTLISTENER_API_KEY=

# Automation / Auth
CRON_SECRET=
SYNC_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Redis (rate limiting / cache)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Optional
SENTRY_DSN=
NEXT_PUBLIC_SITE_URL=
```

Tip (Netlify):
```
netlify link
netlify env:pull --json > .env.local
```

## Install & Run
```
npm install
npm run dev
```

Default dev URL: `http://localhost:3000` (Next.js default). If you need a fixed port, run `next dev -p 3005`.

## Useful Local Commands
- Type check: `npm run type-check`
- Lint: `npm run lint`
- Build: `npm run build`

