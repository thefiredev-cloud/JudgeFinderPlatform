# 🚀 Quick Deploy Checklist for judgefinder.io

## Pre-Deployment Checklist

### ✅ Code Readiness
- [x] Production build succeeds locally (`npm run build`)
- [x] TypeScript has no errors (`npm run type-check`)
- [x] Linting passes (minor warnings acceptable)
- [x] GitHub repository updated with latest changes

### ⚠️ Critical Security Actions
- [ ] **REGENERATE OpenAI API key** (previous key was exposed)
- [ ] Get production Stripe keys from Stripe Dashboard
- [ ] Get production Clerk keys from Clerk Dashboard

## Netlify Setup Steps

### 1️⃣ Connect GitHub to Netlify
```
Repository: Apex-ai-net/judge-finder-platform
Build command: npm ci --production=false && npm run build
Publish directory: .next
```

### 2️⃣ Environment Variables to Set in Netlify

Copy these secure keys:
```bash
# Security Keys (Generate your own secure values)
SYNC_API_KEY=[GENERATE_YOUR_OWN_SECURE_KEY]
CRON_SECRET=[GENERATE_YOUR_OWN_SECURE_KEY]
SESSION_SECRET=[GENERATE_YOUR_OWN_SECURE_KEY]

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://judgefinder.io
NODE_ENV=production
```

Get these from your services:
```bash
# Stripe (from Stripe Dashboard)
STRIPE_SECRET_KEY=[Get from Stripe Dashboard]
STRIPE_WEBHOOK_SECRET=[Will be generated when you create webhook]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[Get from Stripe Dashboard]

# Clerk (from Clerk Dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[Get from Clerk Dashboard]
CLERK_SECRET_KEY=[Get from Clerk Dashboard]
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Supabase (keep existing)
NEXT_PUBLIC_SUPABASE_URL=https://xstlnicbnzdxlgfiewmg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Get from Supabase Dashboard - Settings > API > anon key]
SUPABASE_SERVICE_ROLE_KEY=[Get from Supabase Dashboard - Settings > API > service_role key]

# AI APIs
OPENAI_API_KEY=[REGENERATE NEW KEY - OLD ONE EXPOSED]
GOOGLE_AI_API_KEY=[Get from Google AI Dashboard]
```

### 3️⃣ Domain Configuration
1. Add custom domain: `judgefinder.io`
2. Set DNS records at your domain provider:
   - A Record: @ → 75.2.60.5
   - CNAME: www → [your-site].netlify.app

### 4️⃣ Stripe Webhook Setup
1. In Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://judgefinder.io/api/webhooks/stripe`
3. Select these events:
   - checkout.session.completed
   - invoice.payment_succeeded
   - invoice.payment_failed
   - customer.subscription.deleted
   - customer.subscription.updated
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET` in Netlify

## Post-Deployment Verification

### Quick Tests
```bash
# Check if site is live
curl -I https://judgefinder.io

# Test API health endpoint
curl https://judgefinder.io/api/health

# Check SSL certificate
openssl s_client -connect judgefinder.io:443 -servername judgefinder.io
```

### Functional Tests
- [ ] Homepage loads correctly
- [ ] Sign up/Sign in works (Clerk)
- [ ] Database connection works (Supabase)
- [ ] Judge search returns results
- [ ] AI analytics endpoints respond
- [ ] Stripe webhook test succeeds

## Deployment Commands Reference

### If you need to sync data after deployment:
```bash
npm run sync:judges          # Sync judge data
npm run sync:decisions       # Sync court decisions
npm run analytics:generate   # Generate AI analytics
```

### Monitor deployment:
- Build logs: https://app.netlify.com/sites/[your-site]/deploys
- Function logs: https://app.netlify.com/sites/[your-site]/functions

## Troubleshooting Quick Fixes

### If build fails:
1. Check Node version is 20
2. Verify all env variables are set
3. Clear cache and redeploy

### If domain doesn't work:
1. Wait up to 48 hours for DNS propagation
2. Check DNS records are correct
3. Verify SSL certificate in Netlify dashboard

### If APIs fail:
1. Check API keys are valid and not expired
2. Verify CORS settings in netlify.toml
3. Check function logs for errors

## Support Links
- Netlify Dashboard: https://app.netlify.com
- GitHub Repo: https://github.com/Apex-ai-net/judge-finder-platform
- Stripe Dashboard: https://dashboard.stripe.com
- Clerk Dashboard: https://dashboard.clerk.com
- Supabase Dashboard: https://app.supabase.com

---

**Ready to Deploy!** Follow this checklist step-by-step for successful deployment to judgefinder.io