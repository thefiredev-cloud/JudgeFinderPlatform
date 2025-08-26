-- Create partitioned cases tables for better performance with large datasets
-- This creates multiple tables to distribute the case load

-- Table for cases batch 1 (judges 1-250)
CREATE TABLE IF NOT EXISTS cases_batch_1 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_number VARCHAR(255) NOT NULL,
    case_name TEXT NOT NULL,
    judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
    court_id UUID REFERENCES courts(id),
    case_type VARCHAR(100),
    filing_date DATE,
    decision_date DATE,
    status VARCHAR(50),
    outcome VARCHAR(100),
    summary TEXT,
    courtlistener_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parties TEXT,
    attorneys TEXT,
    practice_area VARCHAR(100),
    case_value DECIMAL(15,2),
    docket_entries JSONB,
    outcome_details JSONB
);

-- Table for cases batch 2 (judges 251-500)
CREATE TABLE IF NOT EXISTS cases_batch_2 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_number VARCHAR(255) NOT NULL,
    case_name TEXT NOT NULL,
    judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
    court_id UUID REFERENCES courts(id),
    case_type VARCHAR(100),
    filing_date DATE,
    decision_date DATE,
    status VARCHAR(50),
    outcome VARCHAR(100),
    summary TEXT,
    courtlistener_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parties TEXT,
    attorneys TEXT,
    practice_area VARCHAR(100),
    case_value DECIMAL(15,2),
    docket_entries JSONB,
    outcome_details JSONB
);

-- Table for cases batch 3 (judges 501-750)
CREATE TABLE IF NOT EXISTS cases_batch_3 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_number VARCHAR(255) NOT NULL,
    case_name TEXT NOT NULL,
    judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
    court_id UUID REFERENCES courts(id),
    case_type VARCHAR(100),
    filing_date DATE,
    decision_date DATE,
    status VARCHAR(50),
    outcome VARCHAR(100),
    summary TEXT,
    courtlistener_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parties TEXT,
    attorneys TEXT,
    practice_area VARCHAR(100),
    case_value DECIMAL(15,2),
    docket_entries JSONB,
    outcome_details JSONB
);

-- Table for cases batch 4 (judges 751-1000)
CREATE TABLE IF NOT EXISTS cases_batch_4 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_number VARCHAR(255) NOT NULL,
    case_name TEXT NOT NULL,
    judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
    court_id UUID REFERENCES courts(id),
    case_type VARCHAR(100),
    filing_date DATE,
    decision_date DATE,
    status VARCHAR(50),
    outcome VARCHAR(100),
    summary TEXT,
    courtlistener_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parties TEXT,
    attorneys TEXT,
    practice_area VARCHAR(100),
    case_value DECIMAL(15,2),
    docket_entries JSONB,
    outcome_details JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_batch_1_judge_id ON cases_batch_1(judge_id);
CREATE INDEX IF NOT EXISTS idx_cases_batch_1_court_id ON cases_batch_1(court_id);
CREATE INDEX IF NOT EXISTS idx_cases_batch_1_filing_date ON cases_batch_1(filing_date);
CREATE INDEX IF NOT EXISTS idx_cases_batch_1_case_number ON cases_batch_1(case_number);

CREATE INDEX IF NOT EXISTS idx_cases_batch_2_judge_id ON cases_batch_2(judge_id);
CREATE INDEX IF NOT EXISTS idx_cases_batch_2_court_id ON cases_batch_2(court_id);
CREATE INDEX IF NOT EXISTS idx_cases_batch_2_filing_date ON cases_batch_2(filing_date);
CREATE INDEX IF NOT EXISTS idx_cases_batch_2_case_number ON cases_batch_2(case_number);

CREATE INDEX IF NOT EXISTS idx_cases_batch_3_judge_id ON cases_batch_3(judge_id);
CREATE INDEX IF NOT EXISTS idx_cases_batch_3_court_id ON cases_batch_3(court_id);
CREATE INDEX IF NOT EXISTS idx_cases_batch_3_filing_date ON cases_batch_3(filing_date);
CREATE INDEX IF NOT EXISTS idx_cases_batch_3_case_number ON cases_batch_3(case_number);

CREATE INDEX IF NOT EXISTS idx_cases_batch_4_judge_id ON cases_batch_4(judge_id);
CREATE INDEX IF NOT EXISTS idx_cases_batch_4_court_id ON cases_batch_4(court_id);
CREATE INDEX IF NOT EXISTS idx_cases_batch_4_filing_date ON cases_batch_4(filing_date);
CREATE INDEX IF NOT EXISTS idx_cases_batch_4_case_number ON cases_batch_4(case_number);

-- Create a view to combine all case tables for easy querying
CREATE OR REPLACE VIEW all_cases AS
SELECT * FROM cases
UNION ALL
SELECT * FROM cases_batch_1
UNION ALL
SELECT * FROM cases_batch_2
UNION ALL
SELECT * FROM cases_batch_3
UNION ALL
SELECT * FROM cases_batch_4;

-- Create function to get case count for a judge across all tables
CREATE OR REPLACE FUNCTION get_judge_case_count(judge_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO total_count
    FROM all_cases
    WHERE judge_id = judge_uuid;
    
    RETURN total_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to determine which batch table to use for a judge
CREATE OR REPLACE FUNCTION get_case_batch_table(judge_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    judge_index INTEGER;
    table_name TEXT;
BEGIN
    -- Get the row number of this judge when ordered by creation
    SELECT row_number INTO judge_index
    FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
        FROM judges
        WHERE jurisdiction = 'CA' OR jurisdiction ILIKE '%California%'
    ) ranked_judges
    WHERE id = judge_uuid;
    
    -- Determine batch table based on index
    IF judge_index <= 250 THEN
        table_name := 'cases_batch_1';
    ELSIF judge_index <= 500 THEN
        table_name := 'cases_batch_2';
    ELSIF judge_index <= 750 THEN
        table_name := 'cases_batch_3';
    ELSE
        table_name := 'cases_batch_4';
    END IF;
    
    RETURN table_name;
END;
$$ LANGUAGE plpgsql;