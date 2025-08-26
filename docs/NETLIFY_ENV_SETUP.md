# 🚀 Netlify Environment Variables Configuration Guide

## 📋 Complete Environment Variable Setup for Production

### Step 1: Access Netlify Environment Settings
1. Login to [Netlify](https://app.netlify.com)
2. Select your site: `judge-finder-platform`
3. Navigate to: **Site settings** → **Environment variables**
4. Or direct URL: `https://app.netlify.com/sites/[your-site-name]/settings/env`

### Step 2: Add Required Environment Variables

Click "Add a variable" for each of the following. Use "Same value for all deploy contexts" unless specified otherwise.

## 🔑 Required Environment Variables

### Database Configuration
```
NEXT_PUBLIC_SUPABASE_URL
Value: [Your Supabase project URL from dashboard]
Context: All

NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Your Supabase anon key]
Context: All

SUPABASE_SERVICE_ROLE_KEY
Value: [Your Supabase service role key - KEEP SECRET]
Context: Production only
Secret: Yes ✓
```

### Authentication (Clerk)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: [Your Clerk production publishable key]
Context: All

CLERK_SECRET_KEY
Value: [Your Clerk production secret key]
Context: Production only
Secret: Yes ✓

NEXT_PUBLIC_CLERK_SIGN_IN_URL
Value: /sign-in
Context: All

NEXT_PUBLIC_CLERK_SIGN_UP_URL
Value: /sign-up
Context: All

NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
Value: /dashboard
Context: All

NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
Value: /welcome
Context: All
```

### AI Services
```
OPENAI_API_KEY
Value: [Your OpenAI API key with spending limits]
Context: Production only
Secret: Yes ✓

GOOGLE_AI_API_KEY
Value: [Your Google Gemini API key]
Context: Production only
Secret: Yes ✓
```

### External APIs
```
COURTLISTENER_API_KEY
Value: [Your CourtListener API key]
Context: Production only
Secret: Yes ✓
```

### Payment Processing (Stripe)
```
STRIPE_SECRET_KEY
Value: [Your Stripe live secret key]
Context: Production only
Secret: Yes ✓

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: [Your Stripe live publishable key]
Context: All

STRIPE_WEBHOOK_SECRET
Value: [Your Stripe webhook endpoint secret]
Context: Production only
Secret: Yes ✓

NEXT_PUBLIC_STRIPE_PRICE_ID
Value: [Your Stripe price ID]
Context: All
```

### Email Service
```
EMAIL_API_KEY
Value: [Your SendGrid/Resend API key]
Context: Production only
Secret: Yes ✓

EMAIL_FROM
Value: noreply@judgefinder.com
Context: All

SENDGRID_API_KEY (if using SendGrid)
Value: [Your SendGrid API key]
Context: Production only
Secret: Yes ✓

RESEND_API_KEY (if using Resend)
Value: [Your Resend API key]
Context: Production only
Secret: Yes ✓
```

### Site Configuration
```
NEXT_PUBLIC_SITE_URL
Value: https://judgefinder.com
Context: Production
Note: Use preview URL for preview deploys

NEXT_PUBLIC_APP_URL
Value: https://judgefinder.com
Context: Production

NEXT_PUBLIC_APP_NAME
Value: JudgeFinder Platform
Context: All

NODE_ENV
Value: production
Context: Production
```

### Security Keys (Generate New!)
```
SYNC_API_KEY
Value: [Generate 32+ char random string]
Context: Production only
Secret: Yes ✓

CRON_SECRET
Value: [Generate 32+ char random string]
Context: Production only
Secret: Yes ✓

COURTLISTENER_WEBHOOK_SECRET
Value: [Generate 32+ char random string]
Context: Production only
Secret: Yes ✓

COURTLISTENER_WEBHOOK_VERIFY_TOKEN
Value: [Generate 32+ char random string]
Context: Production only
Secret: Yes ✓

SESSION_SECRET
Value: [Generate 64+ char random string]
Context: Production only
Secret: Yes ✓
```

### Rate Limiting (Upstash Redis)
```
UPSTASH_REDIS_REST_URL
Value: [Your Upstash Redis REST URL]
Context: All

UPSTASH_REDIS_REST_TOKEN
Value: [Your Upstash Redis token]
Context: Production only
Secret: Yes ✓
```

### Error Monitoring (Sentry)
```
SENTRY_DSN
Value: [Your Sentry DSN]
Context: All

NEXT_PUBLIC_SENTRY_DSN
Value: [Your Sentry DSN]
Context: All

SENTRY_AUTH_TOKEN
Value: [Your Sentry auth token]
Context: Production only
Secret: Yes ✓
```

### Analytics (Optional)
```
NEXT_PUBLIC_GA_MEASUREMENT_ID
Value: [Your Google Analytics ID]
Context: All

NEXT_PUBLIC_POSTHOG_KEY
Value: [Your PostHog project key]
Context: All

NEXT_PUBLIC_POSTHOG_HOST
Value: https://app.posthog.com
Context: All

NEXT_PUBLIC_CLARITY_PROJECT_ID
Value: [Your Microsoft Clarity ID]
Context: All
```

### Admin Configuration
```
ADMIN_USER_IDS
Value: [Comma-separated Clerk user IDs]
Context: Production only
Example: user_2abc123,user_3def456
```

## 🔐 Security Best Practices

### Marking Variables as Secret
For sensitive values, always:
1. Check the "Secret" checkbox when adding the variable
2. This prevents the value from being visible in logs
3. Recommended for all keys, tokens, and passwords

### Deploy Context Configuration
- **Production:** Live site environment
- **Deploy Preview:** Pull request previews
- **Branch Deploy:** Specific branch deployments
- **Local Development:** Use `.env.local` file

### Different Values Per Environment
For variables that differ between environments:
1. Click "Different value for each deploy context"
2. Set production value for "Production"
3. Set test values for "Deploy Preview" and "Branch"

## 📝 Variable Scopes Explanation

### Public Variables (`NEXT_PUBLIC_*`)
- Exposed to browser/client-side code
- Safe for non-sensitive configuration
- Examples: API URLs, app name, public keys

### Private Variables
- Server-side only
- Never exposed to client
- Examples: Secret keys, database credentials

## 🚨 Post-Setup Checklist

After adding all variables:

1. **Test Build**
   - Click "Trigger deploy" → "Clear cache and deploy site"
   - Check build logs for any missing variable errors

2. **Verify Variables**
   - Check Functions tab for serverless function logs
   - Ensure no "undefined" variable errors

3. **Test Critical Features**
   - [ ] Database connection (Supabase)
   - [ ] Authentication flow (Clerk)
   - [ ] Payment processing (Stripe)
   - [ ] Email sending (if configured)
   - [ ] API calls (CourtListener)

4. **Monitor First 24 Hours**
   - Check Sentry for errors
   - Monitor function logs
   - Review rate limiting

## 🛠️ Troubleshooting

### Build Fails with "Variable not found"
- Ensure variable name matches exactly (case-sensitive)
- Check if variable is set for the correct deploy context
- Clear cache and redeploy

### Function Errors "Cannot read undefined"
- Variable might not be available in that context
- Check if it needs `NEXT_PUBLIC_` prefix
- Verify secret variables are properly configured

### Rate Limiting Not Working
- Ensure Upstash credentials are correct
- Check Redis connection in function logs
- Verify both URL and token are set

## 📊 Environment Variable Summary

| Category | Public | Private | Total |
|----------|--------|---------|-------|
| Database | 2 | 1 | 3 |
| Auth | 6 | 1 | 7 |
| AI | 0 | 2 | 2 |
| External APIs | 0 | 1 | 1 |
| Payments | 2 | 2 | 4 |
| Email | 1 | 2 | 3 |
| Site Config | 3 | 1 | 4 |
| Security | 0 | 5 | 5 |
| Rate Limiting | 1 | 1 | 2 |
| Monitoring | 2 | 1 | 3 |
| Analytics | 4 | 0 | 4 |
| Admin | 0 | 1 | 1 |
| **TOTAL** | **21** | **18** | **39** |

## 🔄 Quick Copy Commands

Generate secure random keys:
```bash
# Mac/Linux
openssl rand -base64 32

# Windows PowerShell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 📞 Support Resources

- **Netlify Support:** https://www.netlify.com/support/
- **Netlify Docs:** https://docs.netlify.com/environment-variables/
- **Community Forum:** https://answers.netlify.com/

---

**⚠️ IMPORTANT:** After setting up environment variables, delete any local `.env` files containing real keys and never commit them to version control!