# CourtListener Judges Sync Script

A comprehensive Node.js script for syncing judge data from the CourtListener API v4 `/people/` endpoint with your local database, establishing real court relationships based on actual judicial appointments.

## Overview

This script fetches judges from the CourtListener API and synchronizes them with your PostgreSQL database via Supabase. It maps judge position data to establish authentic court relationships, handles multiple court appointments, and tracks comprehensive position metadata.

## Key Features

- **Position-Based Mapping**: Uses actual judicial positions to establish court relationships (not string matching)
- **Multiple Court Support**: Handles judges who have served at multiple courts
- **Position Metadata**: Tracks appointment dates, position types, tenure, and status
- **Comprehensive Judge Data**: Maps education, biography, political affiliations, ABA ratings
- **Data Integrity**: Creates backups before modifications and handles existing records
- **Rate Limiting**: Respects API limits with configurable delays
- **California Focus**: Optimized for California jurisdiction with federal court support

## Files

- `sync-courtlistener-judges.js` - Main production sync script
- `test-courtlistener-judges-sync.js` - Test script with limited data fetch
- `README-courtlistener-judges-sync.md` - This documentation

## Prerequisites

### Environment Variables Required:
```env
COURTLISTENER_API_KEY=your_api_key_here
COURTLISTENER_BASE_URL=https://www.courtlistener.com/api/rest/v4
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Requirements:

**Judges Table Fields:**
- `id` (UUID, primary key)
- `name` (VARCHAR)
- `court_id` (UUID, foreign key to courts table)
- `court_name` (VARCHAR)
- `jurisdiction` (VARCHAR)
- `appointed_date` (DATE)
- `education` (TEXT)
- `bio` (TEXT)
- `courtlistener_id` (VARCHAR, unique)
- `courtlistener_data` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Courts Table Prerequisites:**
Must have courts with `courtlistener_id` fields populated. Run `sync-courtlistener-courts.js` first.

## Usage

### Test the System First:
```bash
node scripts/test-courtlistener-judges-sync.js
```
This verifies:
- API connectivity and authentication
- Database schema and connectivity
- Court mappings availability
- Sample data analysis

### Run Full Sync:
```bash
node scripts/sync-courtlistener-judges.js
```
Full sync fetches all judges with positions and can take 2-4 hours due to rate limiting.

## Data Mapping

### CourtListener Judge Data → Your Database

| CourtListener Field | Your Field | Notes |
|-------------------|------------|-------|
| `name_first`, `name_last`, etc. | `name` | Constructed full name |
| `positions[0].court` | `court_id` | Mapped via court lookup |
| `positions[0].court_name` | `court_name` | Primary court name |
| Position analysis | `jurisdiction` | Derived from court/position |
| `positions[0].date_start` | `appointed_date` | Primary appointment date |
| `educations` | `education` | Formatted education string |
| Constructed biography | `bio` | Built from multiple fields |
| `id` | `courtlistener_id` | Direct mapping |
| Full API response | `courtlistener_data` | Complete data as JSON |

### Position Processing Logic:

1. **Filter Judge Positions**: Only processes positions with judge-type `position_type`
2. **Court Mapping**: Maps CourtListener court IDs to local court records
3. **Primary Court Selection**: First successfully mapped court becomes primary
4. **Position Metadata**: All positions stored in `courtlistener_data.positions`

### Position Types Handled:
- `jud` - Judge
- `c-jud` - Chief Judge  
- `s-jud` - Senior Judge
- `pj` - Presiding Judge
- `aj` - Associate Judge
- `mag-jud` - Magistrate Judge
- `ref-jud` - Referee Judge
- `ret-jud` - Retired Judge
- `act-jud` - Acting Judge
- `spec-jud` - Special Judge

## Script Behavior

### Backup Process:
1. Creates JSON backup of existing judges data
2. Saves to `scripts/judges-backup-{timestamp}.json`
3. Includes metadata: timestamp, count, full data

### Sync Process:
1. **Load Court Mappings**: Build cache of CourtListener court ID → local court ID
2. **Fetch Judges**: Paginate through CourtListener people with positions
3. **Filter**: Keep only people with actual judge positions
4. **Map Data**: Transform to local schema with position analysis
5. **Upsert**: Update existing judges or create new ones
6. **Report**: Generate detailed statistics

### Position Mapping:
- Uses `positions` array from CourtListener person data
- Maps `position.court` to local court via `courtlistener_id`
- Primary court becomes the first successfully mapped court
- All position metadata preserved in `courtlistener_data`

## Expected Output

### Test Script:
```
🧪 CourtListener Judges Test Service initialized
🔍 Testing CourtListener API with sample judges...

💾 Testing database connectivity...
✅ Database connection successful
📊 Current judges: 1810
🏛️  Current courts: 909

🏛️ Testing court mappings...
✅ Found 567 courts with CourtListener mappings

🔍 Testing CourtListener API connectivity...
✅ API connection successful
📊 Total people available: 45000+
📥 Fetched: 5 people
🔗 Next page URL: Available

🔍 Analyzing sample judge data...
1. John Smith
   ID: 12345
   Positions: 2
     • jud at Court 123 (2015-01-01)
     • c-jud at Court 456 (2020-01-01)
   Education: Harvard Law School (1995)

🎯 Readiness Assessment:
✅ READY: All systems check out!
```

### Full Sync:
```
⚖️ CourtListener Judges Sync Service initialized
🚀 Starting CourtListener Judges Sync...

💾 Creating backup...
✅ Backup created: judges-backup-1755458656644.json

🏛️ Loading court mappings...
✅ Loaded 567 court mappings

📥 Fetching judges from CourtListener API...
📄 Fetching page 1...
   📊 Page 1: 100 people, 23 judges
   ⏱️ Rate limiting: waiting 1200ms...

🔄 Syncing 1200 judges with database...
[1/1200] Processing judge: John Smith
   ✅ Updated existing judge: Hon. John Smith

📊 CourtListener Judges Sync Report
==================================================
⏱️  Duration: 7200 seconds
📡 API requests made: 120
📥 Total judges fetched from API: 1200
🆕 New judges created: 300
🔄 Existing judges updated: 900
🏛️  Court relationships created: 1150
📋 Positions mapped: 2400
❌ Errors encountered: 0
📊 Total judges in database: 2110
⚖️  California judges: 1850
🔗 Judges with CourtListener mapping: 1200
🏛️  Judges with court assignments: 1150
==================================================
✅ Sync completed successfully!
```

## Performance Considerations

### Time Requirements:
- **Test Script**: ~1 minute
- **Full Sync**: 2-4 hours (depends on API data size)
- **Rate Limiting**: 1.2 seconds between API requests
- **Database Operations**: 100ms between writes

### API Efficiency:
- Filters for people with positions only (`has_positions=true`)
- Further filters to judge positions only
- 100 people per request (CourtListener max page size)
- Approximately 450+ API requests for full dataset

### Memory Usage:
- Court mapping cache loaded into memory
- Processes judges in batches to avoid memory issues
- Large JSON objects stored efficiently in JSONB

## Troubleshooting

### Common Issues:

**Missing Court Mappings:**
```
⚠️ No courts with CourtListener IDs found. Please run court sync first.
```
→ Run `sync-courtlistener-courts.js` first to populate court mappings

**API Authentication:**
```
Error: Missing required environment variables: COURTLISTENER_API_KEY
```
→ Check your `.env.local` file has the correct API key

**Database Connection:**
```
Error: Failed to fetch judges for backup
```
→ Verify Supabase credentials and network connectivity

**Position Mapping Issues:**
```
Warning: Judge has no mappable court positions
```
→ Normal - not all judges serve at courts in your database

### Debug Mode:
Add console.log statements for detailed debugging:
```javascript
// In processPositions function
console.log('Processing positions for:', personData.name_first, personData.name_last)
console.log('Positions found:', personData.positions?.length)
```

## Integration Points

### With Court Sync:
- **Dependency**: Requires courts table populated with `courtlistener_id`
- **Run Order**: Always run court sync before judge sync
- **Mapping**: Uses court mappings to establish relationships

### With Case Data:
- Provides `court_id` for case assignment accuracy
- Updates existing judges with new court relationships
- Maintains data consistency across platform

### With Analytics:
- Enriches judge profiles with comprehensive data
- Provides appointment dates for tenure calculations
- Enables position-based filtering and analysis

## Maintenance

### Regular Sync Schedule:
```bash
# Monthly sync (recommended)
0 2 1 * * cd /path/to/project && node scripts/sync-courtlistener-judges.js

# Weekly test
0 1 * * 0 cd /path/to/project && node scripts/test-courtlistener-judges-sync.js
```

### Monitoring:
- Check backup files are created
- Monitor error counts and skipped judges
- Verify court relationship accuracy
- Watch for new position types

### Data Quality:
- Review judges without court assignments
- Check for duplicate CourtListener IDs
- Validate position date ranges
- Monitor education and bio completeness

## Security & Privacy

- API key stored in environment variables
- Service role key used for database access
- Backup files contain full judge data (secure storage required)
- No sensitive personal information beyond public judicial records
- Respects CourtListener terms of service and rate limits

## Advanced Usage

### Custom Position Filtering:
Modify `isJudgePosition()` to include/exclude specific position types.

### Jurisdiction Customization:
Update `determineJurisdiction()` for your specific geographic focus.

### Data Enrichment:
Extend `buildBiography()` to include additional biographical elements.

### Error Handling:
Customize error recovery logic in `syncJudges()` for your requirements.

This script provides the foundation for comprehensive judicial data management with authentic court relationships based on actual judicial appointments rather than name matching or assumptions.