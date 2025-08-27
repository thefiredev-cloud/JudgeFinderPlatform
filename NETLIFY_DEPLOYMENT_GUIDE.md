# Netlify Deployment Guide for Judge Finder Platform

## Production Deployment to judgefinder.io

This guide will walk you through deploying the Judge Finder Platform to Netlify with your custom domain.

## Prerequisites

- GitHub repository is ready: `Apex-ai-net/judge-finder-platform`
- Netlify account created
- Domain `judgefinder.io` is available for configuration
- All API keys and services are ready (Stripe, Clerk, Supabase, AI APIs)

## Step 1: Connect GitHub to Netlify

1. **Log into Netlify**
   - Go to https://app.netlify.com
   - Sign in with your account

2. **Create New Site**
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" as the Git provider
   - Authorize Netlify to access your GitHub account
   - Select `Apex-ai-net/judge-finder-platform` repository

3. **Configure Build Settings**
   - **Base directory**: Leave empty
   - **Build command**: `npm ci --production=false && npm run build`
   - **Publish directory**: `.next`
   - **Node version**: Will use v20 from netlify.toml
   - Click "Deploy site"

## Step 2: Set Environment Variables

Navigate to: **Site settings** → **Environment variables**

Add the following variables (use actual values, not placeholders):

### Required Production Variables

```bash
# Stripe (Get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_[your-actual-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-webhook-secret]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[your-publishable-key]

# Supabase (From your Supabase project)
NEXT_PUBLIC_SUPABASE_URL=https://xstlnicbnzdxlgfiewmg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzdGxuaWNibnpkeGxnZmlld21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNjQ3MDgsImV4cCI6MjA3MDY0MDcwOH0.v3VThW44-3UbRViJ6sXyCE0PV8tfNepuSWRWp3gPQbI
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Clerk Authentication (From Clerk Dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_[your-clerk-key]
CLERK_SECRET_KEY=sk_live_[your-clerk-secret]
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# AI APIs (IMPORTANT: Regenerate OpenAI key first!)
OPENAI_API_KEY=sk-proj-[regenerate-new-key]
GOOGLE_AI_API_KEY=[your-google-ai-key]

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://judgefinder.io
NODE_ENV=production

# Security Keys (Generate your own secure values)
SYNC_API_KEY=[GENERATE_YOUR_OWN_SECURE_KEY]
CRON_SECRET=[GENERATE_YOUR_OWN_SECURE_KEY]
SESSION_SECRET=[GENERATE_YOUR_OWN_SECURE_KEY]
```

### Optional but Recommended

```bash
# CourtListener API
COURTLISTENER_API_KEY=[if-you-have-one]

# Rate Limiting
UPSTASH_REDIS_REST_URL=[your-upstash-url]
UPSTASH_REDIS_REST_TOKEN=[your-upstash-token]

# Error Monitoring
SENTRY_DSN=[your-sentry-dsn]
NEXT_PUBLIC_SENTRY_DSN=[your-public-sentry-dsn]
```

## Step 3: Configure Custom Domain

1. **In Netlify Dashboard**
   - Go to **Domain settings**
   - Click "Add custom domain"
   - Enter `judgefinder.io`
   - Follow the verification steps

2. **DNS Configuration**
   - Add these records at your domain provider:
   ```
   Type: A
   Name: @
   Value: 75.2.60.5
   
   Type: CNAME
   Name: www
   Value: [your-netlify-subdomain].netlify.app
   ```

3. **SSL Certificate**
   - Netlify will automatically provision an SSL certificate
   - This may take up to 24 hours
   - Check status in Domain settings → HTTPS

## Step 4: Configure Stripe Webhooks

1. **In Stripe Dashboard**
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - URL: `https://judgefinder.io/api/webhooks/stripe`
   - Select events:
     - checkout.session.completed
     - invoice.payment_succeeded
     - invoice.payment_failed
     - customer.subscription.deleted
     - customer.subscription.updated
   - Save the webhook signing secret
   - Update `STRIPE_WEBHOOK_SECRET` in Netlify

## Step 5: Deploy and Verify

1. **Trigger Deployment**
   - Any push to `main` branch will auto-deploy
   - Or manually trigger: Deploys → "Trigger deploy"

2. **Monitor Build**
   - Watch the build logs for any errors
   - Typical build time: 2-5 minutes

3. **Verify Deployment**
   ```bash
   # Check site is live
   curl -I https://judgefinder.io
   
   # Test API health
   curl https://judgefinder.io/api/health
   ```

## Step 6: Post-Deployment Checklist

- [ ] Site loads at https://judgefinder.io
- [ ] Clerk authentication works (sign up/sign in)
- [ ] Supabase database connection successful
- [ ] Judge search functionality works
- [ ] AI analytics endpoints respond
- [ ] Stripe webhooks are received
- [ ] SSL certificate is active
- [ ] Security headers are present

## Troubleshooting

### Build Failures
- Check build logs in Netlify dashboard
- Verify all dependencies are in package.json
- Ensure Node version is compatible (v20)

### Environment Variable Issues
- Double-check all variables are set
- No quotes around values in Netlify UI
- Restart build after adding variables

### Domain Not Working
- DNS propagation can take up to 48 hours
- Verify DNS records are correct
- Check SSL certificate status

### API Errors
- Verify all API keys are valid
- Check CORS settings in netlify.toml
- Review function logs in Netlify

## Security Reminders

1. **IMMEDIATELY regenerate the OpenAI API key** - The current one was exposed
2. Never commit real API keys to Git
3. Use Netlify environment variables for all secrets
4. Regularly rotate API keys and secrets
5. Monitor Sentry for security issues

## Support Resources

- Netlify Documentation: https://docs.netlify.com
- Next.js on Netlify: https://docs.netlify.com/integrations/frameworks/next-js/
- Status Page: https://www.netlifystatus.com
- GitHub Repository: https://github.com/Apex-ai-net/judge-finder-platform

## Next Steps

After successful deployment:

1. **Data Population** (if not already done)
   ```bash
   npm run sync:judges
   npm run sync:decisions
   npm run analytics:generate
   ```

2. **Performance Testing**
   ```bash
   npm run lighthouse
   npm run test:load
   ```

3. **Set Up Monitoring**
   - Configure Sentry error tracking
   - Set up Upstash for rate limiting
   - Enable Netlify Analytics

4. **Configure Backups**
   - Set up Supabase database backups
   - Configure Git repository backups

---

**Deployment Status**: Ready for production deployment to judgefinder.io
**Last Updated**: January 2025