# Deployment Guide for Judge Finder Platform

## 🚀 Quick Deployment Options

### Option 1: Deploy to Vercel (Recommended)

1. **Fork or Import Repository**
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import `https://github.com/Apex-ai-net/judge-finder-platform`

2. **Configure Environment Variables**
   Add these in Vercel's Environment Variables section:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   OPENAI_API_KEY=your_openai_key
   COURTLISTENER_API_KEY=your_courtlistener_key
   STRIPE_SECRET_KEY=your_stripe_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
   ```

3. **Deploy**
   - Click "Deploy"
   - Your app will be live at `your-project.vercel.app`

### Option 2: Deploy to Netlify

1. **Connect Repository**
   - Go to [Netlify](https://www.netlify.com)
   - Click "New site from Git"
   - Choose GitHub and select the repository

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: .next
   ```

3. **Environment Variables**
   - Add the same environment variables as above

4. **Deploy**
   - Click "Deploy site"

### Option 3: Deploy to Railway

1. **Create New Project**
   - Go to [Railway](https://railway.app)
   - Click "New Project"
   - Choose "Deploy from GitHub repo"

2. **Configure**
   - Select the repository
   - Add environment variables
   - Railway auto-detects Next.js configuration

3. **Deploy**
   - Click "Deploy"

## 🗄️ Database Setup (Supabase)

1. **Create Supabase Project**
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Wait for database provisioning

2. **Run Database Schema**
   - Go to SQL Editor in Supabase Dashboard
   - Copy contents from `lib/database/schema.sql`
   - Run the SQL script

3. **Enable Authentication**
   - Go to Authentication settings
   - Enable Email/Password auth
   - Configure OAuth providers (optional)

4. **Get API Keys**
   - Go to Settings > API
   - Copy:
     - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
     - Anon/Public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - Service Role key → `SUPABASE_SERVICE_ROLE_KEY`

## 🔑 API Keys Setup

### CourtListener API
1. Register at [CourtListener](https://www.courtlistener.com/sign-up/)
2. Get API token from account settings
3. Add as `COURTLISTENER_API_KEY`

### OpenAI API
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create API key in API Keys section
3. Add as `OPENAI_API_KEY`

### Stripe Setup
1. Create account at [Stripe](https://stripe.com)
2. Get keys from Dashboard:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
3. Set up webhook endpoint for `/api/webhooks/stripe`
4. Add webhook secret as `STRIPE_WEBHOOK_SECRET`

## 🌐 Custom Domain Setup

### For Vercel
1. Go to Project Settings > Domains
2. Add your domain (e.g., `judgefinder.io`)
3. Follow DNS configuration instructions

### For Netlify
1. Go to Domain Settings
2. Add custom domain
3. Configure DNS records as shown

## 📊 Production Checklist

- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] Authentication enabled
- [ ] Payment processing tested
- [ ] SSL certificate active
- [ ] Security headers configured
- [ ] Error tracking setup (Sentry/LogRocket)
- [ ] Analytics configured (Google Analytics/Mixpanel)
- [ ] Backup strategy implemented
- [ ] Rate limiting configured
- [ ] CDN setup for assets

## 🔧 Post-Deployment

### Monitor Performance
```bash
# Check build size
npm run build

# Analyze bundle
npm run analyze
```

### Database Backup
```sql
-- Create backup policy in Supabase
CREATE POLICY backup_policy ON public.judges
FOR SELECT
TO authenticated
USING (true);
```

### Enable Monitoring
1. Set up Vercel Analytics
2. Configure Sentry for error tracking
3. Add Google Analytics

## 📞 Support

For deployment issues:
- Check [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- Review [Supabase Guides](https://supabase.com/docs/guides)
- Open issue on [GitHub](https://github.com/Apex-ai-net/judge-finder-platform/issues)

## 🎉 Launch Checklist

1. **Pre-Launch**
   - [ ] Test all user flows
   - [ ] Verify payment processing
   - [ ] Check mobile responsiveness
   - [ ] Test search functionality
   - [ ] Verify judge data loading

2. **Launch Day**
   - [ ] Enable production mode
   - [ ] Activate monitoring
   - [ ] Announce on social media
   - [ ] Submit to legal tech directories

3. **Post-Launch**
   - [ ] Monitor error logs
   - [ ] Track user analytics
   - [ ] Gather user feedback
   - [ ] Plan feature updates

---

**Need Help?** Open an issue or contact support@judgefinder.io