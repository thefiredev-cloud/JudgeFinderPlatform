# CourtListener Courts Sync Script

A robust Node.js script for syncing court data from the CourtListener API v4 with your local database.

## Overview

This script fetches all courts from the CourtListener API and synchronizes them with your PostgreSQL database via Supabase. It handles pagination, rate limiting, data mapping, and provides comprehensive logging.

## Features

- **Complete API Coverage**: Fetches all 3,352+ courts from CourtListener
- **Cursor-based Pagination**: Handles large datasets efficiently
- **Rate Limiting**: Respects API limits with 1-second delays between requests
- **Data Backup**: Creates automatic backup before modifications
- **California Normalization**: Maps jurisdiction codes to your "CA" standard
- **Error Handling**: Continues on non-critical errors with detailed logging
- **Production Ready**: Full transaction support and data integrity checks

## Files

- `sync-courtlistener-courts.js` - Main production sync script
- `test-courtlistener-sync.js` - Test script with limited data fetch
- `README-courtlistener-sync.md` - This documentation

## Prerequisites

### Environment Variables Required:
```env
COURTLISTENER_API_KEY=your_api_key_here
COURTLISTENER_BASE_URL=https://www.courtlistener.com/api/rest/v4
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Schema:
Your `courts` table must have these fields:
- `id` (UUID, primary key)
- `name` (VARCHAR)
- `type` (VARCHAR - 'federal', 'state', 'local')
- `jurisdiction` (VARCHAR)
- `address` (TEXT)
- `website` (VARCHAR)
- `phone` (VARCHAR)
- `courtlistener_id` (VARCHAR, unique)
- `courthouse_metadata` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Usage

### Test the Connection First:
```bash
npm run test:courtlistener-sync
```
This fetches only 5 courts to verify API connectivity and data mapping.

### Run Full Sync:
```bash
npm run sync:courtlistener-courts
```
This fetches all ~3,352 courts and can take 60+ minutes due to rate limiting.

### Direct Node Execution:
```bash
node scripts/sync-courtlistener-courts.js
node scripts/test-courtlistener-sync.js
```

## Data Mapping

### CourtListener → Your Database

| CourtListener Field | Your Field | Notes |
|-------------------|------------|-------|
| `full_name` / `short_name` | `name` | Uses full_name, falls back to short_name |
| `jurisdiction` | `jurisdiction` | Normalized (F→Federal, C→CA, etc.) |
| `id` | `courtlistener_id` | Stored as string for mapping |
| Court analysis | `type` | federal/state/local based on jurisdiction & name |
| Constructed | `address` | Built from position + jurisdiction |
| Full API response | `courthouse_metadata` | Complete CourtListener data stored as JSON |

### Jurisdiction Normalization:
- `F`, `FD`, `FB` → `Federal`
- `C`, `CACD`, `CAED`, `CAND`, `CASD` → `CA`
- Other codes preserved as-is

### Court Type Detection:
- `jurisdiction === 'F'` → `federal`
- Name contains municipal/city/traffic/justice → `local`
- Default → `state`

## Script Behavior

### Backup Process:
1. Creates JSON backup of existing courts data
2. Saves to `scripts/courts-backup-{timestamp}.json`
3. Includes metadata: timestamp, count, full data

### Sync Process:
1. **Fetch Phase**: Paginate through all CourtListener courts
2. **Rate Limiting**: 1-second delay between API requests
3. **Mapping Phase**: Transform data to your schema
4. **Database Phase**: Upsert courts (update existing, create new)
5. **Report Phase**: Generate detailed statistics

### Error Handling:
- **API Errors**: Extends rate limit, continues with next page
- **Data Errors**: Logs error, skips court, continues processing
- **Database Errors**: Logs error, skips court, continues processing
- **Fatal Errors**: Creates backup, provides detailed error report

## Expected Output

### Test Script:
```
🧪 CourtListener Test Sync initialized
🔍 Testing CourtListener API with first 5 courts...

📊 Total courts available: 3352
📥 Fetched: 20 courts
🔗 Next page URL: Available

1. Supreme Court of the United States
   ID: scotus
   Jurisdiction: F
   ...

✅ Test completed successfully!
```

### Full Sync:
```
🏛️ CourtListener Courts Sync Service initialized
🚀 Starting CourtListener Courts Sync...

💾 Creating backup...
✅ Backup created: courts-backup-1755458656644.json

📥 Fetching courts from CourtListener API...
📄 Fetching page 1...
   📊 Page 1: 20 courts
   ⏱️ Rate limiting: waiting 1000ms...

🔄 Syncing 3352 courts with database...
[1/3352] Processing court: Supreme Court...
   ✅ Updated existing court: Supreme Court

📊 CourtListener Courts Sync Report
==================================================
⏱️  Duration: 3847 seconds
📥 Total fetched from API: 3352
🆕 New courts created: 892
🔄 Existing courts updated: 2460
⏭️  Courts skipped: 0
❌ Errors encountered: 0
📊 Total courts in database: 4244
🏛️  California courts: 567
🔗 Courts with CourtListener mapping: 3352
==================================================
✅ Sync completed successfully!
```

## Performance Considerations

### Time Requirements:
- **Test Script**: ~30 seconds
- **Full Sync**: 60-90 minutes (due to rate limiting)
- **Incremental Updates**: Only updates existing records

### API Rate Limits:
- 1 request per second (configurable)
- 200 courts per request (CourtListener max page size)
- ~17 API requests for full dataset

### Database Impact:
- Backup created before any changes
- Upsert operations (no duplicates)
- 100ms delay between database operations
- Metadata stored as JSONB for efficient querying

## Troubleshooting

### Common Issues:

**API Authentication:**
```
Error: Missing required environment variables: COURTLISTENER_API_KEY
```
→ Check your `.env.local` file has the correct API key

**Database Connection:**
```
Error: Failed to fetch courts for backup
```
→ Verify Supabase credentials and network connectivity

**Rate Limiting:**
```
API error 429: Rate limit exceeded
```
→ Script automatically handles this by extending delays

**Data Integrity:**
```
Error: Failed to insert court: duplicate key value
```
→ Court already exists with same courtlistener_id (normal for updates)

### Debug Mode:
Add console.log statements to key functions for detailed debugging:
```javascript
// In mapCourtData function
console.log('Mapping court:', courtData.id, courtData.full_name)
```

## Integration Points

### With Your Platform:
- Updates existing court records with CourtListener metadata
- Maintains your existing court structure
- Adds mapping for future API integrations
- Preserves California jurisdiction normalization

### With Other Scripts:
- Can be run before judge sync scripts
- Provides court mapping for case data imports
- Backup files can be used for rollbacks

## Maintenance

### Regular Sync Schedule:
```bash
# Weekly sync (recommended)
0 2 * * 0 cd /path/to/project && npm run sync:courtlistener-courts

# Monthly test
0 1 1 * * cd /path/to/project && npm run test:courtlistener-sync
```

### Monitoring:
- Check backup files are created
- Monitor error counts in reports
- Verify California court counts remain stable
- Watch for new court types or jurisdictions

### Updates:
- CourtListener API changes require schema updates
- New jurisdiction codes need mapping additions
- Court type detection may need refinement

## Security Notes

- API key stored in environment variables
- Service role key used for database access
- Backup files contain full court data (secure storage)
- No sensitive judicial data exposed (only court metadata)

This script provides the foundation for comprehensive court data management and integration with the CourtListener ecosystem.