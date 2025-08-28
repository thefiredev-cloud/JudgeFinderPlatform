# Netlify Environment Variables Setup Guide

## ⚠️ CRITICAL: Required Environment Variables for Deployment

After the security fixes have been applied, you **MUST** configure these environment variables in your Netlify dashboard before deployment will work.

## Step 1: Access Netlify Environment Variables

1. Log into your Netlify dashboard
2. Select your site (judge-finder-platform)
3. Go to **Site configuration** → **Environment variables**
4. Click **Add a variable**

## Step 2: Add Required Variables

Add each of these environment variables with their actual values:

### Database Configuration (REQUIRED)
```
NEXT_PUBLIC_SUPABASE_URL = https://xstlnicbnzdxlgfiewmg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [Your actual Supabase anon key - starts with eyJ...]
SUPABASE_SERVICE_ROLE_KEY = [Your Supabase service role key]
```

**To get your Supabase keys:**
1. Go to https://supabase.com/dashboard
2. Select your project (xstlnicbnzdxlgfiewmg)
3. Navigate to Settings → API
4. Copy the `anon` public key for NEXT_PUBLIC_SUPABASE_ANON_KEY
5. Copy the `service_role` key for SUPABASE_SERVICE_ROLE_KEY (keep this secret!)

### Authentication (REQUIRED - Or disable auth)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = [Your Clerk publishable key]
CLERK_SECRET_KEY = [Your Clerk secret key]
NEXT_PUBLIC_CLERK_SIGN_IN_URL = /sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL = /sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = /dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = /welcome
```

**To get your Clerk keys:**
1. Sign up at https://clerk.com (if you haven't already)
2. Create a new application
3. Go to API Keys section
4. Copy the publishable and secret keys

**Alternative: Deploy without authentication**
If you don't have Clerk keys yet, add:
```
SKIP_AUTH_BUILD = true
```

### AI Services (OPTIONAL - But recommended)
```
OPENAI_API_KEY = [Your OpenAI API key]
GOOGLE_AI_API_KEY = [Your Google AI API key]
```

### External APIs (OPTIONAL)
```
COURTLISTENER_API_KEY = [Your CourtListener API key]
```

### Site Configuration (REQUIRED)
```
NEXT_PUBLIC_SITE_URL = https://[your-site-name].netlify.app
NEXT_PUBLIC_APP_URL = https://[your-site-name].netlify.app
NEXT_PUBLIC_APP_NAME = JudgeFinder Platform
```

### Admin Configuration (OPTIONAL)
```
ADMIN_USER_IDS = [Comma-separated list of admin user IDs]
```

### Security Keys (OPTIONAL - For enhanced security)
```
SYNC_API_KEY = [Generate a random 64-character hex string]
CRON_SECRET = [Generate a random 64-character hex string]
SESSION_SECRET = [Generate a random 64-character hex string]
```

### Analytics (OPTIONAL)
```
NEXT_PUBLIC_GA_MEASUREMENT_ID = [Your Google Analytics ID]
NEXT_PUBLIC_CLARITY_PROJECT_ID = [Your Microsoft Clarity ID]
SENTRY_DSN = [Your Sentry DSN for error tracking]
SENTRY_AUTH_TOKEN = [Your Sentry auth token]
```

### Payment Processing (OPTIONAL - If using Stripe)
```
STRIPE_SECRET_KEY = [Your Stripe secret key]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = [Your Stripe publishable key]
STRIPE_WEBHOOK_SECRET = [Your Stripe webhook secret]
```

### Rate Limiting (OPTIONAL - For production)
```
UPSTASH_REDIS_REST_URL = [Your Upstash Redis URL]
UPSTASH_REDIS_REST_TOKEN = [Your Upstash Redis token]
```

## Step 3: Configure Build Settings

Ensure these build settings are configured:
- **Build command:** `npm ci --legacy-peer-deps && npm run build`
- **Publish directory:** `.next`
- **Node version:** 20 (should be auto-detected from .nvmrc)

## Step 4: Deploy

After adding all required environment variables:
1. Trigger a new deployment
2. Monitor the build logs
3. If the build fails with secrets detection:
   - Check that all JWT tokens are removed from .env files
   - Ensure PRODUCTION_KEYS.txt is deleted
   - Clear build cache and redeploy

## Minimum Required Variables for Basic Deployment

If you want to deploy quickly with minimal configuration:

```
# Required
NEXT_PUBLIC_SUPABASE_URL = https://xstlnicbnzdxlgfiewmg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [Your actual Supabase anon key]
NEXT_PUBLIC_SITE_URL = https://[your-site-name].netlify.app
NEXT_PUBLIC_APP_URL = https://[your-site-name].netlify.app
NEXT_PUBLIC_APP_NAME = JudgeFinder Platform

# Skip authentication during build
SKIP_AUTH_BUILD = true
```

## Troubleshooting

### Error: Secrets detected in build
- Ensure all .env files use placeholders, not real keys
- Check that PRODUCTION_KEYS.txt is deleted
- Clear Netlify build cache: Site settings → Build & deploy → Clear cache and retry

### Error: Build fails with missing environment variables
- Double-check all required variables are set in Netlify dashboard
- Ensure variable names match exactly (case-sensitive)
- Check for typos in variable values

### Error: Authentication not working
- Verify Clerk keys are correct
- Ensure callback URLs in Clerk match your Netlify URL
- Check that NEXT_PUBLIC_CLERK_* variables are set

## Security Notes

1. **Never commit real keys to Git** - Always use placeholders in .env files
2. **Use Netlify's environment variables** for all sensitive data
3. **Rotate keys regularly** for production deployments
4. **Monitor access logs** for any suspicious activity

## Support

If you continue to have deployment issues:
1. Clear your Netlify build cache
2. Check the build logs for specific error messages
3. Verify all environment variables are properly set
4. Ensure no sensitive files are being tracked by Git

## Quick Checklist

- [ ] Deleted scripts/PRODUCTION_KEYS.txt
- [ ] Removed hardcoded JWT tokens from .env files
- [ ] Created .netlifyignore file
- [ ] Added all required environment variables to Netlify
- [ ] Cleared Netlify build cache
- [ ] Triggered fresh deployment

Once all steps are completed, your deployment should succeed!