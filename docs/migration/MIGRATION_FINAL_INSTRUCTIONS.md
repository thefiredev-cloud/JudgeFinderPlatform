# Database Migration Final Instructions

## Current Status
❌ **Migration NOT yet applied** - Schema columns and table do not exist yet

## Required Manual Steps

### Step 1: Execute Complete Migration SQL

**Location:** Open Supabase SQL Editor at:
```
https://supabase.com/dashboard/project/xstlnicbnzdxlgfiewmg/sql
```

**Action:** Copy and execute the entire content from:
```
scripts/complete-migration.sql
```

This will:
- Add `courthouse_metadata` JSONB column to `courts` table
- Add `positions` JSONB column to `judges` table  
- Create `judge_court_positions` table with all constraints and indexes
- Add performance indexes for efficient queries

### Step 2: Run Post-Migration Data Population

After SQL execution is complete, run:
```bash
node scripts/complete-migration-process.js
```

This will:
- Populate `judge_court_positions` table with existing judge-court relationships
- Update court judge counts
- Normalize jurisdictions to "CA"
- Verify data integrity

### Step 3: Verify Migration Success

Run verification script:
```bash
node scripts/verify-table-state.js
```

Expected results:
- ✅ `courts.courthouse_metadata` column exists
- ✅ `judges.positions` column exists  
- ✅ `judge_court_positions` table exists and accessible
- ✅ All 1,810 California judges remain accessible

### Step 4: Test Application

1. Restart development server: `npx next dev -p 3005`
2. Visit judges page: http://localhost:3005/judges
3. Confirm all California judges are accessible
4. Test search and filtering functionality

## Migration Content Summary

The migration adds:

### New Columns
- `courts.courthouse_metadata` - JSONB for CourtListener sync data
- `courts.courtlistener_id` - External API mapping
- `judges.positions` - JSONB array for position history
- `judges.courtlistener_id` - External API mapping

### New Table: judge_court_positions
```sql
CREATE TABLE judge_court_positions (
    id UUID PRIMARY KEY,
    judge_id UUID NOT NULL,
    court_id UUID NOT NULL,
    position_type VARCHAR(100) DEFAULT 'Judge',
    appointment_date DATE,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Performance Indexes
- 11 specialized indexes for court-judge relationship queries
- Partial indexes for active positions
- CourtListener sync optimization indexes

## Expected Outcome

After successful migration:
- **Enhanced Schema**: Support for judge-court relationships and external data sync
- **Performance**: Optimized queries for court detail pages and judge profiles  
- **Data Integrity**: All existing California judges remain accessible
- **Future Ready**: Foundation for advanced judicial analytics and bias detection

## Rollback Plan

If issues occur, rollback using:
```sql
-- Execute supabase/migrations/20250817_004_rollback_migration.sql
```

## Support

After migration completion:
- Monitor application performance
- Verify API endpoints continue working
- Test search functionality across jurisdictions