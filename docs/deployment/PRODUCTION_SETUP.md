# JudgeFinder Platform - Production Setup Guide

## Environment Variables Configuration

### 1. Database & Authentication
```bash
# Supabase Production Database
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...production-service-role-key

# Clerk Production Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...production-publishable-key
CLERK_SECRET_KEY=sk_live_...production-secret-key
```

### 2. Site Configuration
```bash
# Production URL
NEXT_PUBLIC_SITE_URL=https://judgefinder.io
NODE_ENV=production

# Security Headers
NEXT_PUBLIC_APP_NAME=JudgeFinder Platform
```

### 3. API Keys & Services
```bash
# CourtListener Production API
COURTLISTENER_API_KEY=production-courtlistener-key

# Email Service (SendGrid)
EMAIL_API_KEY=SG....production-sendgrid-key
EMAIL_FROM=noreply@judgefinder.io

# OpenAI (if using AI features)
OPENAI_API_KEY=sk-proj-...production-openai-key
```

### 4. Security & Rate Limiting
```bash
# Generate secure random keys (32+ characters)
SYNC_API_KEY=generate-with-crypto.randomBytes(32).toString('hex')
CRON_SECRET=generate-with-crypto.randomBytes(32).toString('hex')
COURTLISTENER_WEBHOOK_SECRET=generate-with-crypto.randomBytes(32).toString('hex')
COURTLISTENER_WEBHOOK_VERIFY_TOKEN=generate-with-crypto.randomBytes(32).toString('hex')

# Redis for rate limiting (Upstash recommended)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### 5. Analytics & Monitoring
```bash
# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Error Tracking (Sentry)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Search Engine Verification
GOOGLE_SITE_VERIFICATION=your-google-verification-code
BING_SITE_VERIFICATION=your-bing-verification-code
```

## Security Checklist

### Required Before Production:
- [ ] Replace all development/test API keys with production keys
- [ ] Generate secure random strings for all webhook secrets
- [ ] Set up SSL certificates (handled by Vercel/Netlify)
- [ ] Configure CORS for production domain
- [ ] Set up error monitoring (Sentry recommended)
- [ ] Configure rate limiting with Redis
- [ ] Set up analytics and monitoring
- [ ] Test all API endpoints in production environment
- [ ] Configure Supabase RLS policies for production
- [ ] Set up automated database backups

### Environment-Specific Settings:

#### Development (.env.local)
```bash
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3005
# Use test/development API keys
```

#### Staging
```bash
NODE_ENV=staging
NEXT_PUBLIC_SITE_URL=https://staging.judgefinder.io
# Use staging API keys
```

#### Production
```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://judgefinder.io
# Use production API keys only
```

## Deployment Steps

### 1. Vercel Deployment (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add CLERK_SECRET_KEY production
# ... add all production environment variables
```

### 2. Database Migration
```bash
# Deploy RPC functions to production Supabase
npx supabase db push --project-ref your-production-project-ref

# Apply all migrations
npm run migrate:prod
```

### 3. DNS Configuration
- Point domain to Vercel deployment
- Configure SSL certificates
- Set up www redirect

### 4. Monitoring Setup
- Configure Sentry for error tracking
- Set up Google Analytics
- Configure Uptime monitoring

## Security Best Practices

1. **Environment Variables**: Never commit .env files to git
2. **API Key Rotation**: Rotate all API keys quarterly
3. **Database Security**: Use RLS policies in Supabase
4. **Rate Limiting**: Implement Redis-based rate limiting
5. **CORS**: Restrict to production domain only
6. **Headers**: Implement security headers via next.config.js
7. **Authentication**: Use Clerk's production environment
8. **Webhooks**: Verify all webhook signatures

## Post-Deployment Verification

1. [ ] All API endpoints respond correctly
2. [ ] Database queries work with production data
3. [ ] Authentication flow works end-to-end
4. [ ] Email notifications are sent properly
5. [ ] Analytics tracking is active
6. [ ] Error monitoring is receiving events
7. [ ] Rate limiting is functioning
8. [ ] Search functionality works
9. [ ] Bias analysis displays correctly
10. [ ] Judge comparison tool functions

## Emergency Procedures

### Rollback Procedure
1. Revert to previous Vercel deployment
2. Restore database backup if needed
3. Update DNS if necessary

### Security Incident Response
1. Immediately rotate all API keys
2. Check logs for unauthorized access
3. Review and update environment variables
4. Monitor error rates and user reports

## Contact Information
- Platform Admin: admin@judgefinder.io
- Technical Support: support@judgefinder.io
- Security Issues: security@judgefinder.io