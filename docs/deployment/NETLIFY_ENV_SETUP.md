# Netlify Environment Variables Setup

## Required Environment Variables

Add these environment variables in your Netlify dashboard:
**Site Settings → Environment Variables**

### Database (Supabase)
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY
```

### Authentication (Clerk) - REQUIRED
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY
CLERK_SECRET_KEY=sk_live_YOUR_SECRET
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### AI APIs (Rotate these immediately if exposed)
```
OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY
GOOGLE_AI_API_KEY=AIza_YOUR_NEW_KEY
```

### External APIs
```
COURTLISTENER_API_KEY=YOUR_API_KEY
```

### Site Configuration
```
NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app
NODE_ENV=production
```

### Security Keys (Generate new ones)
```
SYNC_API_KEY=GENERATE_32_CHAR_HEX
CRON_SECRET=GENERATE_32_CHAR_HEX
SESSION_SECRET=GENERATE_32_CHAR_HEX
```

### Optional: Monitoring
```
SENTRY_DSN=YOUR_SENTRY_DSN
SENTRY_AUTH_TOKEN=YOUR_SENTRY_TOKEN
```

### Optional: Rate Limiting (Upstash Redis)
```
UPSTASH_REDIS_REST_URL=YOUR_REDIS_URL
UPSTASH_REDIS_REST_TOKEN=YOUR_REDIS_TOKEN
```

## How to Add in Netlify

1. Go to your Netlify dashboard
2. Select your site
3. Navigate to **Site configuration → Environment variables**
4. Click **Add a variable**
5. Choose **Add a single variable**
6. Enter the key and value
7. Make sure scope includes **Production**
8. Click **Save**

## Generating Secure Keys

Run this command to generate secure random keys:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Important Notes

- NEVER commit these values to git
- Rotate all API keys if they were ever exposed
- Use different keys for development and production
- Enable 2FA on all service accounts