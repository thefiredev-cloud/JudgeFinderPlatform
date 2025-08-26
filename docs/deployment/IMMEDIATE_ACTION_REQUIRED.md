# 🚨 IMMEDIATE ACTION REQUIRED

## ✅ Completed Actions

1. **Removed sensitive files from repository** ✓
   - Deleted SECURITY_FIX_INSTRUCTIONS.md
   - Deleted .env.production.safe 
   - Deleted .env.production.template
   - Deleted CLERK_SETUP_GUIDE.md

2. **Cleaned git history** ✓
   - Removed all traces of exposed API keys from git history
   - Force pushed clean history to GitHub

3. **Fixed database schema** ✓
   - Created migration for jurisdiction column
   - Migration file: `supabase/migrations/20250822_003_add_jurisdiction_column.sql`

4. **Updated documentation** ✓
   - Created NETLIFY_ENV_SETUP.md with environment variable guide
   - Updated README with Netlify deployment instructions

## ⚠️ URGENT: Actions You Must Take Now

### 1. ROTATE ALL API KEYS IMMEDIATELY

The following API keys were exposed and MUST be rotated:

#### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Delete the compromised key (starts with sk-proj-bW-W9pg...)
3. Create a new API key
4. Add to Netlify environment variables

#### Google AI (Gemini) API Key  
1. Go to https://console.cloud.google.com/apis/credentials
2. Delete the compromised key (AIzaSyCKqW7z9VR8cJBd5zyQOVH4yKm2XkQWlbN)
3. Create a new API key with domain restrictions
4. Add to Netlify environment variables

#### CourtListener API Key
1. Login to your CourtListener account
2. Regenerate API token
3. Add to Netlify environment variables

#### Supabase Service Role Key
1. Go to https://app.supabase.com/project/xstlnicbnzdxlgfiewmg/settings/api
2. Regenerate service role key
3. Update in Netlify environment variables

### 2. Apply Database Migration

Run this SQL in your Supabase SQL editor:

```sql
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS jurisdiction TEXT DEFAULT 'CA';

UPDATE cases 
SET jurisdiction = 'CA' 
WHERE jurisdiction IS NULL;

CREATE INDEX IF NOT EXISTS idx_cases_jurisdiction ON cases(jurisdiction);
```

### 3. Configure Netlify Environment Variables

1. Go to your Netlify dashboard
2. Navigate to **Site configuration → Environment variables**
3. Add all variables listed in [NETLIFY_ENV_SETUP.md](./NETLIFY_ENV_SETUP.md)
4. Use your NEW, rotated API keys

### 4. Trigger New Deployment

After completing steps 1-3:

1. Go to Netlify dashboard
2. Navigate to **Deploys**
3. Click **Trigger deploy → Deploy site**

## Security Checklist

- [ ] Rotated OpenAI API key
- [ ] Rotated Google AI API key
- [ ] Rotated CourtListener API key
- [ ] Regenerated Supabase service role key
- [ ] Applied database migration for jurisdiction column
- [ ] Added all environment variables to Netlify
- [ ] Triggered new deployment on Netlify
- [ ] Enabled 2FA on all service accounts

## Next Steps

Once the above is complete:

1. **Monitor deployment** - Check Netlify deploy logs
2. **Test the site** - Verify all features work
3. **Run data sync** - Populate cases with `npm run sync:decisions`
4. **Generate analytics** - Run `npm run analytics:generate`

## Support

If you encounter issues:
1. Check Netlify deploy logs for errors
2. Verify all environment variables are set correctly
3. Ensure database migrations were applied
4. Check that API keys are valid and have proper permissions

## Time Estimate

- Rotating API keys: 15 minutes
- Database migration: 5 minutes
- Netlify configuration: 10 minutes
- Deployment: 5-10 minutes

**Total: ~40 minutes**