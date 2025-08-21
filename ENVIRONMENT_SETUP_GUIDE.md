# 🔧 Environment Setup Guide - JudgeFinder Platform

## Quick Start

### 1. Development Setup
```bash
# Copy environment template
cp .env.example .env.local

# Generate production secrets (for later use)
node scripts/generate-production-secrets.js
```

### 2. Required Environment Variables

#### Essential for Development
```bash
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...your-key
CLERK_SECRET_KEY=sk_test_...your-secret-key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3005
NODE_ENV=development
```

#### Production-Critical Variables
```bash
# Generated Security Keys (use: node scripts/generate-production-secrets.js)
SYNC_API_KEY=<32-char-hex-key>
CRON_SECRET=<32-char-hex-key>
COURTLISTENER_WEBHOOK_SECRET=<32-char-hex-key>
COURTLISTENER_WEBHOOK_VERIFY_TOKEN=<32-char-hex-key>

# Production URLs
NEXT_PUBLIC_SITE_URL=https://judgefinder.io
NODE_ENV=production
```

## Service Configuration

### Supabase Setup
1. Create new Supabase project
2. Get URL and keys from Dashboard > Settings > API
3. Enable Row Level Security (RLS)
4. Deploy database schema from `/database` folder

### Clerk Authentication
1. Create Clerk application
2. Configure sign-in methods
3. Set up production/development instances
4. Configure webhook endpoints

### Optional Services

#### Rate Limiting (Upstash Redis)
```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

#### Analytics
```bash
# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Microsoft Clarity
NEXT_PUBLIC_CLARITY_PROJECT_ID=your-project-id
```

#### Error Tracking (Sentry)
```bash
SENTRY_DSN=https://your-dsn@sentry.io/project
SENTRY_AUTH_TOKEN=your-auth-token
```

#### Email (SendGrid)
```bash
EMAIL_API_KEY=SG....your-sendgrid-key
EMAIL_FROM=noreply@judgefinder.io
```

#### Payments (Stripe)
```bash
STRIPE_SECRET_KEY=sk_live_...your-live-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...your-live-key
STRIPE_WEBHOOK_SECRET=whsec_...your-webhook-secret
```

## Environment Validation

### Check Configuration
```bash
# Validate all environment variables are set
npm run validate:env

# Test database connection
npm run test:db

# Verify API endpoints
npm run test:api
```

### Development Testing
```bash
# Start development server
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## Production Deployment

### Pre-Deployment Checklist
- [ ] All production keys generated and stored securely
- [ ] Database RLS policies enabled
- [ ] Authentication configured for production
- [ ] Analytics and monitoring set up
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] SSL certificates ready

### Deployment Platforms

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add CLERK_SECRET_KEY production
# ... add all production variables
```

#### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy to production
netlify deploy --prod

# Configure environment variables in Netlify dashboard
```

### Post-Deployment Verification
```bash
# Test production endpoints
curl -I https://judgefinder.io
curl -s https://judgefinder.io/api/judges/list?limit=1

# Monitor deployment
vercel logs  # or netlify logs
```

## Security Best Practices

### Key Management
- Generate new keys for each environment
- Never commit keys to version control
- Rotate keys quarterly
- Use environment-specific keys
- Store keys in deployment platform securely

### Database Security
- Enable Row Level Security (RLS)
- Use service role key only on server
- Never expose service role key to client
- Configure proper CORS settings
- Regular security audits

### API Protection
- Rate limiting on all endpoints
- Input validation and sanitization
- Proper error handling
- Webhook signature verification
- HTTPS only in production

## Troubleshooting

### Common Issues

#### Environment Variables Not Loading
```bash
# Check .env.local exists and has correct format
cat .env.local

# Verify Next.js is reading variables
npm run dev -- --turbo
```

#### Database Connection Fails
```bash
# Test Supabase connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
client.from('judges').select('count').then(console.log);
"
```

#### Authentication Issues
```bash
# Verify Clerk configuration
npm run test:auth
```

### Getting Help
- Check deployment platform logs
- Review environment variable spelling
- Verify service configurations
- Test with minimal configuration first
- Gradual rollout of features

## Environment Templates

- **Development**: `.env.example`
- **Production**: `.env.production.template`
- **Key Generator**: `scripts/generate-production-secrets.js`
- **Validation**: `scripts/validate-environment.js`