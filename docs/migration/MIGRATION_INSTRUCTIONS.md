# Database Migration Instructions

## Current Status
The database migration requires manual execution of SQL statements in the Supabase dashboard because:
1. Supabase REST API doesn't support direct DDL execution
2. The `judge_court_positions` table exists but has access restrictions
3. Missing columns need to be added to existing tables

## Required Manual Steps

### Step 1: Execute Schema Changes
Open your Supabase project dashboard SQL Editor and execute these statements:

```sql
-- Add missing courthouse_metadata column to courts table
ALTER TABLE courts ADD COLUMN IF NOT EXISTS courthouse_metadata JSONB DEFAULT '{}'::jsonb;

-- Add missing positions column to judges table  
ALTER TABLE judges ADD COLUMN IF NOT EXISTS positions JSONB DEFAULT '[]'::jsonb;

-- Ensure judge_court_positions table exists and is accessible
CREATE TABLE IF NOT EXISTS judge_court_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judge_id UUID NOT NULL,
    court_id UUID NOT NULL,
    position_type VARCHAR(100) NOT NULL DEFAULT 'Judge',
    appointment_date DATE,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_judge_court_positions_judge_id 
        FOREIGN KEY (judge_id) REFERENCES judges(id) ON DELETE CASCADE,
    CONSTRAINT fk_judge_court_positions_court_id 
        FOREIGN KEY (court_id) REFERENCES courts(id) ON DELETE CASCADE,
    
    -- Ensure unique active positions per judge-court combination
    CONSTRAINT unique_active_judge_court_position 
        UNIQUE(judge_id, court_id, status, position_type) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_judge_id ON judge_court_positions(judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_court_id ON judge_court_positions(court_id);
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_status ON judge_court_positions(status);
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_dates ON judge_court_positions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_type ON judge_court_positions(position_type);
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_lookup ON judge_court_positions(judge_id, court_id, status, start_date DESC);

-- Add check constraints for data integrity
ALTER TABLE judge_court_positions ADD CONSTRAINT IF NOT EXISTS check_position_dates 
    CHECK (
        (start_date IS NULL OR end_date IS NULL OR start_date <= end_date) AND
        (appointment_date IS NULL OR start_date IS NULL OR appointment_date <= start_date)
    );

ALTER TABLE judge_court_positions ADD CONSTRAINT IF NOT EXISTS check_valid_status
    CHECK (status IN ('active', 'inactive', 'retired', 'resigned', 'transferred', 'deceased'));

ALTER TABLE judge_court_positions ADD CONSTRAINT IF NOT EXISTS check_valid_position_type
    CHECK (position_type IN (
        'Judge', 'Chief Judge', 'Presiding Judge', 'Associate Judge', 
        'Senior Judge', 'Retired Judge', 'Acting Judge', 'Pro Tem Judge',
        'Magistrate Judge', 'Administrative Judge', 'Deputy Judge'
    ));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_judge_court_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_judge_court_positions_updated_at ON judge_court_positions;
CREATE TRIGGER trigger_judge_court_positions_updated_at
    BEFORE UPDATE ON judge_court_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_judge_court_positions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE judge_court_positions IS 'Junction table tracking judge appointments and positions across different courts with historical data';
COMMENT ON COLUMN judge_court_positions.position_type IS 'Type of judicial position (Judge, Chief Judge, Senior Judge, etc.)';
COMMENT ON COLUMN judge_court_positions.appointment_date IS 'Date when judge was officially appointed to this position';
COMMENT ON COLUMN judge_court_positions.start_date IS 'Date when judge began serving in this position';
COMMENT ON COLUMN judge_court_positions.end_date IS 'Date when judge ended service in this position (NULL for current positions)';
COMMENT ON COLUMN judge_court_positions.status IS 'Current status of the position (active, inactive, retired, etc.)';
COMMENT ON COLUMN judge_court_positions.metadata IS 'Additional position metadata including CourtListener data, appointment details, etc.';
COMMENT ON COLUMN courts.courthouse_metadata IS 'JSON metadata from CourtListener including sync info, position data, and API response details';
COMMENT ON COLUMN judges.positions IS 'JSON array of position history including court assignments, titles, and tenure dates';
```

### Step 2: Disable RLS (if needed)
If you encounter permission issues with the `judge_court_positions` table, disable RLS temporarily:

```sql
-- Disable RLS on judge_court_positions table for migration
ALTER TABLE judge_court_positions DISABLE ROW LEVEL SECURITY;
```

### Step 3: Verify Schema Changes
Execute this verification query:

```sql
-- Verify all changes are in place
SELECT 
    'courthouse_metadata' as column_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courts' AND column_name = 'courthouse_metadata'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'positions' as column_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'judges' AND column_name = 'positions'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'judge_court_positions_table' as column_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'judge_court_positions'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;
```

## After Manual Schema Changes

Once you've executed the SQL statements above, run the automated data migration:

```bash
# Run the data migration script
node scripts/complete-migration-process.js
```

This will:
1. Verify the schema changes are complete
2. Populate the judge_court_positions table with existing relationships
3. Update court judge counts based on new relationships
4. Handle California jurisdiction normalization (CA vs California)
5. Verify all 1,810 California judges remain accessible

## Expected Results

After completion, you should have:
- ✅ Enhanced courts table with `courthouse_metadata` field
- ✅ Enhanced judges table with `positions` field  
- ✅ Populated `judge_court_positions` table with relationship data
- ✅ Updated court judge counts
- ✅ Normalized jurisdiction values to "CA"
- ✅ All 1,810+ California judges accessible via the platform

## Rollback (if needed)

If you need to rollback the changes:

```sql
-- Remove added columns
ALTER TABLE courts DROP COLUMN IF EXISTS courthouse_metadata;
ALTER TABLE judges DROP COLUMN IF EXISTS positions;

-- Drop the positions table
DROP TABLE IF EXISTS judge_court_positions CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_judge_court_positions_updated_at() CASCADE;
```

## Current Database State

Before migration:
- 📊 Total judges: 1,946
- 📊 California judges: 1,810 
- 📊 Total courts: 909
- 📊 California courts: 104
- 📊 Judge-court positions: 0 (table needs creation/access)

Target after migration:
- ✅ All current data preserved
- ✅ New relationship structure implemented
- ✅ CourtListener integration fields ready
- ✅ Performance indexes created
- ✅ Data integrity constraints enforced