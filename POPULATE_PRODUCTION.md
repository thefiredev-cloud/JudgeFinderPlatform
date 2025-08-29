# 🚀 Production Data Population Guide

## Quick Fix for Missing Judges/Courts on judgefinder.io

Your production site has no data because the Supabase database is empty. Follow these steps to populate it:

## Step 1: Create Production Environment File
Create `.env.production` file with your production credentials:

```bash
# Copy from Netlify environment variables
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
COURTLISTENER_API_KEY=your_courtlistener_api_key
NEXT_PUBLIC_SITE_URL=https://judgefinder.io
```

## Step 2: Run Population Script

```bash
# This will populate your production database
npm run populate:production
```

The script will:
- ✅ Sync 1,810 California judges from CourtListener
- ✅ Sync 909 California courts 
- ✅ Optionally generate sample cases
- ✅ Show real-time progress

## Step 3: Verify Data

```bash
# Check data status
npm run data:status
```

Visit https://judgefinder.io/judges to see your populated data!

## Step 4: Set Up Automated Sync (Optional)

```bash
# Configure daily automatic updates
npm run setup:cron
```

## Alternative: Manual Sync Commands

If the populate script fails, run these individually:

```bash
npm run sync:courts      # Sync court data
npm run sync:judges      # Sync judge data  
npm run sync:decisions   # Sync decision data (optional)
```

## Monitoring

Check data status at any time:
- **API Endpoint:** https://judgefinder.io/api/admin/data-status
- **Command Line:** `npm run data:status`

## Troubleshooting

If data doesn't appear:
1. Check Netlify environment variables are set correctly
2. Verify Supabase connection with `npm run data:status`
3. Check browser console for errors on judgefinder.io
4. Ensure CORS is configured in Supabase dashboard

## Support

The production database must be populated separately from your local development database. This is a one-time setup that takes about 5-10 minutes.