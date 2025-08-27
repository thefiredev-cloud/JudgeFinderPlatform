# 🚀 Deploy JudgeFinder to Netlify - Quick Steps

## ✅ Completed Steps:
- ✅ Code builds successfully
- ✅ TypeScript and linting pass
- ✅ Changes pushed to GitHub
- ✅ Environment variables prepared

## 📋 Manual Steps Required (10 minutes):

### Step 1: Connect GitHub to Netlify (2 minutes)
1. **Open Netlify:** https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize GitHub and select: **`Apex-ai-net/judge-finder-platform`**
5. **Build Settings** (should auto-detect from netlify.toml):
   - Base directory: *(leave empty)*
   - Build command: `npm ci --production=false && npm run build`
   - Publish directory: `.next`
6. Click **"Deploy site"** (initial deploy will fail - that's okay!)

### Step 2: Add Environment Variables (5 minutes)
1. Go to **Site settings** → **Environment variables**
2. Click **"Add a variable"** → **"Import from a .env file"**
3. Copy ALL content from `NETLIFY_ENV_VARIABLES.txt`
4. **Fill in the missing values:**
   
   **REQUIRED to get site working:**
   - `SUPABASE_SERVICE_ROLE_KEY` - Get from Supabase dashboard
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Get from Clerk dashboard
   - `CLERK_SECRET_KEY` - Get from Clerk dashboard
   - `OPENAI_API_KEY` - Generate NEW key from OpenAI
   - `GOOGLE_AI_API_KEY` - Get from Google AI

   **For payments (can add later):**
   - `STRIPE_SECRET_KEY` - From Stripe dashboard
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - From Stripe dashboard

5. Click **"Save"**

### Step 3: Redeploy (2 minutes)
1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for build to complete (2-3 minutes)

### Step 4: Add Custom Domain (1 minute)
1. Go to **"Domain management"**
2. Click **"Add domain"**
3. Enter: `judgefinder.io`
4. Follow DNS configuration instructions
5. Netlify will automatically provision SSL certificate

## 🔗 Quick Links:
- **Netlify Dashboard:** https://app.netlify.com
- **Clerk Dashboard:** https://dashboard.clerk.com
- **Supabase Dashboard:** https://app.supabase.com/project/xstlnicbnzdxlgfiewmg
- **OpenAI API Keys:** https://platform.openai.com/api-keys
- **Google AI:** https://makersuite.google.com/app/apikey
- **Stripe Dashboard:** https://dashboard.stripe.com

## ✅ Verification Checklist:
After deployment completes:
- [ ] Site loads at Netlify URL (e.g., amazing-judge-123.netlify.app)
- [ ] Sign up/Sign in buttons work
- [ ] Judge search returns results
- [ ] No console errors in browser

## 🎉 Success!
Once these steps are complete, your JudgeFinder Platform will be live!

## Need Help?
- Build failed? Check the deploy logs in Netlify
- Environment variable issues? Double-check all keys are correct
- Domain not working? DNS can take up to 48 hours to propagate