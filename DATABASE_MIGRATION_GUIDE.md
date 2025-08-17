# Database Schema Migration Guide

## CourtListener Integration & Judge-Court Relationships

This guide covers the database schema updates to support proper court-judge relationships with CourtListener data integration.

## Overview

The migration adds:
- **CourtListener mapping fields** for external data synchronization
- **Judge-court positions junction table** for many-to-many relationships
- **Performance indexes** for efficient queries
- **Historical position tracking** with metadata support

## Migration Files

### 1. Core Migrations (`supabase/migrations/`)

```
20250817_001_add_courtlistener_fields.sql    # Add CourtListener ID fields
20250817_002_create_judge_court_positions.sql # Create junction table
20250817_003_add_performance_indexes.sql     # Add performance indexes
20250817_004_rollback_migration.sql          # Rollback script
```

### 2. Migration Scripts (`scripts/`)

```
run-database-migrations.js                   # Execute Supabase migrations
migrate-existing-judge-court-data.js         # Populate new relationship table
```

## Schema Changes

### Courts Table Additions

```sql
-- New columns added to courts table
ALTER TABLE courts 
ADD COLUMN courtlistener_id VARCHAR(50) UNIQUE,
ADD COLUMN courthouse_metadata JSONB DEFAULT '{}'::jsonb;
```

**Fields:**
- `courtlistener_id`: External ID from CourtListener API
- `courthouse_metadata`: JSON metadata including sync info and API response details

### Judges Table Additions

```sql
-- New columns added to judges table  
ALTER TABLE judges
ADD COLUMN courtlistener_id VARCHAR(50) UNIQUE,
ADD COLUMN positions JSONB DEFAULT '[]'::jsonb;
```

**Fields:**
- `courtlistener_id`: External ID from CourtListener API
- `positions`: JSON array of position history and assignments

### New Judge-Court Positions Table

```sql
CREATE TABLE judge_court_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judge_id UUID NOT NULL REFERENCES judges(id),
    court_id UUID NOT NULL REFERENCES courts(id),
    position_type VARCHAR(100) NOT NULL DEFAULT 'Judge',
    appointment_date DATE,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Supported Position Types:**
- Judge, Chief Judge, Presiding Judge, Associate Judge
- Senior Judge, Retired Judge, Acting Judge, Pro Tem Judge
- Magistrate Judge, Administrative Judge, Deputy Judge

**Status Values:**
- active, inactive, retired, resigned, transferred, deceased

## Performance Indexes

The migration adds specialized indexes for:
- Court detail page queries (judges at specific courts)
- Judge profile queries (courts where judge served)
- Active positions filtering
- Historical position lookups
- CourtListener synchronization
- Jurisdiction-based filtering

## Migration Process

### Step 1: Run Database Migrations

```bash
# Preview all migrations
node scripts/run-database-migrations.js --help

# Run all migrations
node scripts/run-database-migrations.js

# Run specific migration
node scripts/run-database-migrations.js --migration=20250817_001

# Rollback all changes
node scripts/run-database-migrations.js --rollback
```

### Step 2: Migrate Existing Data

```bash
# Preview data migration
node scripts/migrate-existing-judge-court-data.js --dry-run

# Execute data migration
node scripts/migrate-existing-judge-court-data.js
```

### Step 3: Verify Migration

```bash
# Run data integrity check
node scripts/verify-data-integrity.js

# Test API endpoints
node scripts/test-all-api-endpoints.js
```

## Data Integrity Features

### Constraints
- Foreign key constraints on judge_id and court_id
- Unique constraints for active judge-court-position combinations
- Check constraints for valid dates and status values
- Unique CourtListener ID constraints

### Triggers
- Automatic `updated_at` timestamp updates
- Data validation on insert/update

### Indexes
- Composite indexes for efficient court-judge lookups
- Partial indexes for active positions only
- Jurisdiction-based filtering indexes
- CourtListener synchronization indexes

## API Impact

### New Query Capabilities

```javascript
// Get judges serving at a specific court
const { data: judgesAtCourt } = await supabase
  .from('judge_court_positions')
  .select(`
    judge_id,
    position_type,
    start_date,
    judges (name, jurisdiction),
    courts (name, type)
  `)
  .eq('court_id', courtId)
  .eq('status', 'active')

// Get court history for a judge
const { data: judgeCourtHistory } = await supabase
  .from('judge_court_positions')
  .select(`
    court_id,
    position_type,
    start_date,
    end_date,
    status,
    courts (name, type, jurisdiction)
  `)
  .eq('judge_id', judgeId)
  .order('start_date', { ascending: false })
```

### Enhanced Court Detail Pages

Courts can now display:
- Current serving judges with position types
- Historical judge assignments
- Position metadata and tenure information
- CourtListener synchronization status

## CourtListener Integration

### Sync Process
1. Courts sync: `node scripts/sync-courtlistener-courts.js`
2. Judges sync: `node scripts/sync-courtlistener-judges.js`
3. Position mapping: Automatic during judge sync

### Metadata Structure

```javascript
// courthouse_metadata example
{
  "courtlistener_data": {
    "id": 123,
    "url": "https://www.courtlistener.com/api/rest/v4/courts/123/",
    "jurisdiction": "C",
    "position": 45.5,
    "citation_string": "Cal. Super. Ct."
  },
  "sync_metadata": {
    "last_synced": "2025-08-17T12:00:00Z",
    "sync_source": "courtlistener_api_v4"
  }
}

// positions metadata example
{
  "migration_source": "courtlistener_position",
  "courtlistener_position_id": 456,
  "appointment_authority": "Governor",
  "confirmation_date": "2020-01-15"
}
```

## Rollback Process

If migration issues occur:

```bash
# Rollback database changes
node scripts/run-database-migrations.js --rollback

# Restore from backup (created automatically)
# Backup files: scripts/db-backup-[timestamp].json
```

## Testing

### Validation Scripts
```bash
# Test database integrity
node scripts/verify-data-integrity.js

# Test court-judge relationships
node scripts/test-court-judge-relationships.js

# Performance testing
node scripts/performance-test.js
```

### Manual Verification
1. Check new columns exist in courts and judges tables
2. Verify judge_court_positions table creation
3. Confirm existing data migration
4. Test court detail page queries
5. Validate CourtListener sync capabilities

## Support

For issues with migration:
1. Check migration logs for specific errors
2. Verify environment variables are set
3. Ensure Supabase permissions are correct
4. Use rollback if needed and retry
5. Check backup files for data recovery

## Next Steps

After successful migration:
1. Update court detail page components
2. Implement position-based filtering
3. Add historical position views
4. Schedule regular CourtListener syncs
5. Monitor query performance