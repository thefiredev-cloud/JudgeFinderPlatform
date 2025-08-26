# JudgeFinder Platform - Deployment Guide

## Netlify Deployment via GitHub

This guide walks you through deploying the JudgeFinder platform to Netlify via GitHub integration.

## Prerequisites

Before deploying, ensure you have:
1. A GitHub account with the repository
2. A Netlify account (free tier works)
3. Accounts for required services:
   - Supabase (database)
   - Clerk (authentication)
   - Google Cloud (for Gemini API)
   - CourtListener (data source)
   - Upstash Redis (caching)
   - Sentry (optional, for error tracking)

## Step 1: Prepare GitHub Repository

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Verify files are properly ignored:**
   - Check that `.gitignore` excludes all sensitive files
   - Ensure no `.env` files are committed
   - Confirm no production keys are in the repository

## Step 2: Connect GitHub to Netlify

1. **Log in to Netlify Dashboard**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"

2. **Connect to GitHub**
   - Choose "Deploy with GitHub"
   - Authorize Netlify to access your GitHub account
   - Select the `judge-finder-platform` repository

3. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18 (automatically detected from netlify.toml)

## Step 3: Configure Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables, add:

### Required Variables

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# AI Services
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Data Source
COURTLISTENER_API_TOKEN=your_courtlistener_token

# Cache
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Application
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NODE_ENV=production

# Security
CRON_SECRET=generate_32_character_random_string
```

### Optional Variables (Recommended)

```bash
# Error Tracking
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
SENTRY_AUTH_TOKEN=your_auth_token
```

## Step 4: Configure Custom Domain

1. **In Netlify Dashboard:**
   - Go to Domain Settings
   - Click "Add custom domain"
   - Enter your domain (e.g., `judgefinder.io`)

2. **Update DNS Records:**
   - Add Netlify's DNS records to your domain provider
   - For apex domain: A record pointing to `75.2.60.5`
   - For www: CNAME record pointing to your Netlify subdomain

3. **Enable HTTPS:**
   - Netlify automatically provisions SSL certificates
   - Wait for DNS propagation (5-30 minutes)

## Step 5: Deploy

1. **Initial Deploy:**
   - Click "Deploy site" in Netlify
   - Monitor build logs for any errors
   - First build may take 5-10 minutes

2. **Verify Deployment:**
   - Check the provided Netlify URL
   - Test key functionality:
     - Homepage loads
     - Judge search works
     - API endpoints respond
     - Authentication functions

## Step 6: Post-Deployment Setup

### Initialize Database

1. **Run migrations:**
   ```bash
   # In your local environment with production env vars
   npm run db:push
   ```

2. **Sync initial data:**
   ```bash
   npm run sync:courts
   npm run sync:judges
   npm run sync:decisions
   ```

3. **Generate AI analytics:**
   ```bash
   npm run analytics:generate
   ```

### Configure Webhooks

1. **In Clerk Dashboard:**
   - Add webhook endpoint: `https://your-domain.com/api/auth/webhook`
   - Select events: user.created, user.updated

2. **In CourtListener (if using webhooks):**
   - Add webhook URL: `https://your-domain.com/api/webhooks/courtlistener`

### Set Up Monitoring

1. **Netlify Analytics:**
   - Enable in Netlify dashboard (optional paid feature)

2. **Sentry Error Tracking:**
   - Verify Sentry is receiving errors
   - Set up alerts for critical issues

## Continuous Deployment

With GitHub integration, Netlify automatically deploys on:
- Push to `main` branch (production)
- Pull requests (preview deployments)

### Branch Deployments

- **Production:** `main` branch → your-domain.com
- **Preview:** Pull requests → unique preview URLs
- **Branch deploys:** Other branches → branch-name--your-site.netlify.app

## Troubleshooting

### Build Failures

1. **Check build logs in Netlify dashboard**
2. **Common issues:**
   - Missing environment variables
   - TypeScript errors: Run `npm run type-check` locally
   - ESLint errors: Run `npm run lint` locally

### Runtime Errors

1. **Check Function logs in Netlify**
2. **Verify environment variables are set**
3. **Check Sentry for error details**

### Performance Issues

1. **Enable caching headers (already in netlify.toml)**
2. **Verify Redis connection for rate limiting**
3. **Check database query performance**

## Maintenance

### Regular Updates

1. **Weekly data sync:**
   - Can be triggered manually or via GitHub Actions
   - Keeps judge and court data current

2. **Monitor usage:**
   - Check Netlify bandwidth limits
   - Monitor API rate limits
   - Review error rates in Sentry

### Scaling Considerations

- **Netlify Pro:** For higher traffic and build minutes
- **Database:** Consider Supabase Pro for larger datasets
- **Caching:** Implement CDN caching for static assets

## Security Checklist

- [ ] All environment variables configured
- [ ] HTTPS enabled
- [ ] Security headers active (CSP, HSTS, etc.)
- [ ] Rate limiting configured with Redis
- [ ] Clerk authentication properly set up
- [ ] No sensitive data in repository
- [ ] Regular security updates applied

## Support

For deployment issues:
1. Check Netlify status page
2. Review build logs
3. Consult Netlify documentation
4. Open issue in GitHub repository

---

**Last Updated:** December 2024
**Platform Version:** 0.1.0