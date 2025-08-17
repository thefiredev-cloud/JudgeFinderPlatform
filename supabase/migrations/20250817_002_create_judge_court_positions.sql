-- Migration: Create judge-court positions junction table
-- Version: 20250817_002
-- Description: Creates many-to-many relationship table for judge court appointments with position metadata

-- Create judge_court_positions table for many-to-many relationships
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

-- Composite index for efficient queries
CREATE INDEX IF NOT EXISTS idx_judge_court_positions_lookup 
    ON judge_court_positions(judge_id, court_id, status, start_date DESC);

-- Add check constraints for data integrity
ALTER TABLE judge_court_positions 
ADD CONSTRAINT check_position_dates 
    CHECK (
        (start_date IS NULL OR end_date IS NULL OR start_date <= end_date) AND
        (appointment_date IS NULL OR start_date IS NULL OR appointment_date <= start_date)
    );

ALTER TABLE judge_court_positions
ADD CONSTRAINT check_valid_status
    CHECK (status IN ('active', 'inactive', 'retired', 'resigned', 'transferred', 'deceased'));

ALTER TABLE judge_court_positions
ADD CONSTRAINT check_valid_position_type
    CHECK (position_type IN (
        'Judge', 'Chief Judge', 'Presiding Judge', 'Associate Judge', 
        'Senior Judge', 'Retired Judge', 'Acting Judge', 'Pro Tem Judge',
        'Magistrate Judge', 'Administrative Judge', 'Deputy Judge'
    ));

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_judge_court_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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