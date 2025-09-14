-- ========================================
-- COMPREHENSIVE CALIFORNIA JUDICIAL DATA SCHEMA
-- Supports ALL judge types and court levels
-- ========================================

-- Add judge type classification
ALTER TABLE judges ADD COLUMN IF NOT EXISTS judge_type VARCHAR(50);
ALTER TABLE judges ADD COLUMN IF NOT EXISTS position_type VARCHAR(100);
ALTER TABLE judges ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE judges ADD COLUMN IF NOT EXISTS federal_judge BOOLEAN DEFAULT FALSE;
ALTER TABLE judges ADD COLUMN IF NOT EXISTS state_judge BOOLEAN DEFAULT FALSE;

-- Add court level and classification
ALTER TABLE courts ADD COLUMN IF NOT EXISTS court_level VARCHAR(50);
ALTER TABLE courts ADD COLUMN IF NOT EXISTS court_system VARCHAR(50); -- 'federal', 'state', 'administrative'
ALTER TABLE courts ADD COLUMN IF NOT EXISTS parent_court_id UUID REFERENCES courts(id);
ALTER TABLE courts ADD COLUMN IF NOT EXISTS is_appellate BOOLEAN DEFAULT FALSE;
ALTER TABLE courts ADD COLUMN IF NOT EXISTS annual_filings INTEGER;

-- Create comprehensive judge types enum
CREATE TYPE judge_classification AS ENUM (
    'article_iii_judge',           -- Federal Article III judges
    'magistrate_judge',            -- Federal Magistrate judges
    'bankruptcy_judge',            -- Federal Bankruptcy judges
    'senior_judge',                -- Senior status federal judges
    'state_supreme_justice',       -- CA Supreme Court Justices
    'state_appellate_justice',     -- CA Court of Appeal Justices
    'superior_court_judge',        -- CA Superior Court Judges
    'court_commissioner',          -- Court Commissioners
    'judge_pro_tem',              -- Judges Pro Tem
    'referee',                    -- Court Referees
    'administrative_law_judge',   -- ALJs
    'wcab_judge',                 -- Workers' Comp Appeals Board
    'tax_court_judge',            -- Tax Court Judges
    'immigration_judge',          -- Immigration Judges
    'hearing_officer',            -- Administrative Hearing Officers
    'retired_judge',              -- Retired/Recalled judges
    'visiting_judge'              -- Visiting/Assigned judges
);

-- Update judges table with classification
ALTER TABLE judges ADD COLUMN IF NOT EXISTS classification judge_classification;

-- Create court levels enum
CREATE TYPE court_level_type AS ENUM (
    'federal_supreme',      -- US Supreme Court
    'federal_circuit',      -- Federal Circuit Courts
    'federal_district',     -- Federal District Courts
    'federal_bankruptcy',   -- Federal Bankruptcy Courts
    'federal_magistrate',   -- Federal Magistrate Courts
    'state_supreme',        -- CA Supreme Court
    'state_appellate',      -- CA Courts of Appeal
    'state_trial',          -- CA Superior Courts
    'state_municipal',      -- Municipal Courts (historical)
    'state_justice',        -- Justice Courts (historical)
    'administrative',       -- Administrative courts
    'specialized'           -- Specialized courts (WCAB, Tax, etc.)
);

ALTER TABLE courts ADD COLUMN IF NOT EXISTS level court_level_type;

-- Create dockets table for PACER integration
CREATE TABLE IF NOT EXISTS dockets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    docket_number VARCHAR(100) NOT NULL,
    court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
    judge_id UUID REFERENCES judges(id) ON DELETE SET NULL,
    case_name VARCHAR(500),
    case_type VARCHAR(100),
    nature_of_suit VARCHAR(200),
    date_filed DATE,
    date_terminated DATE,
    date_last_filing DATE,
    status VARCHAR(50),
    jurisdiction_type VARCHAR(50), -- 'federal_question', 'diversity', 'us_government'
    jury_demand BOOLEAN DEFAULT FALSE,
    demand_amount DECIMAL(12,2),
    cause VARCHAR(500),
    courtlistener_id VARCHAR(100) UNIQUE,
    pacer_case_id VARCHAR(100),
    pacer_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create docket entries table
CREATE TABLE IF NOT EXISTS docket_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    docket_id UUID REFERENCES dockets(id) ON DELETE CASCADE,
    entry_number INTEGER NOT NULL,
    date_filed DATE NOT NULL,
    description TEXT,
    document_number VARCHAR(50),
    pacer_doc_id VARCHAR(100),
    pacer_seq_no INTEGER,
    courtlistener_id VARCHAR(100),
    is_available BOOLEAN DEFAULT FALSE,
    page_count INTEGER,
    file_size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create parties table for case participants
CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    docket_id UUID REFERENCES dockets(id) ON DELETE CASCADE,
    party_name VARCHAR(500) NOT NULL,
    party_type VARCHAR(50), -- 'plaintiff', 'defendant', 'appellant', 'appellee', 'petitioner', 'respondent'
    party_role VARCHAR(100),
    represented_by TEXT[], -- Array of attorney names
    contact_info TEXT,
    courtlistener_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create attorneys table for legal representatives
CREATE TABLE IF NOT EXISTS case_attorneys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    docket_id UUID REFERENCES dockets(id) ON DELETE CASCADE,
    attorney_name VARCHAR(255) NOT NULL,
    firm_name VARCHAR(255),
    bar_number VARCHAR(50),
    contact_info TEXT,
    representing TEXT[], -- Array of party names
    date_entered DATE,
    date_withdrawn DATE,
    is_lead_attorney BOOLEAN DEFAULT FALSE,
    courtlistener_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create judicial positions history table
CREATE TABLE IF NOT EXISTS judicial_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
    court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
    position_type VARCHAR(100) NOT NULL,
    classification judge_classification,
    appointer VARCHAR(255), -- Who appointed them
    appointment_date DATE,
    confirmation_date DATE,
    start_date DATE,
    end_date DATE,
    end_reason VARCHAR(100), -- 'retired', 'elevated', 'term_ended', 'deceased', 'resigned'
    is_current BOOLEAN DEFAULT TRUE,
    predecessor_name VARCHAR(255),
    successor_name VARCHAR(255),
    notes TEXT,
    courtlistener_position_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create judge education history
CREATE TABLE IF NOT EXISTS judge_education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
    school_name VARCHAR(255) NOT NULL,
    degree_type VARCHAR(100),
    degree_year INTEGER,
    degree_detail TEXT,
    is_law_degree BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create judge career history (pre-judicial)
CREATE TABLE IF NOT EXISTS judge_career_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
    organization VARCHAR(255),
    position VARCHAR(255),
    start_year INTEGER,
    end_year INTEGER,
    job_type VARCHAR(100), -- 'private_practice', 'government', 'prosecutor', 'public_defender', 'academic'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create opinions table (enhanced from cases)
CREATE TABLE IF NOT EXISTS opinions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    cluster_id VARCHAR(100),
    opinion_type VARCHAR(50), -- 'lead', 'concurrence', 'dissent', 'concur_in_part'
    author_judge_id UUID REFERENCES judges(id) ON DELETE SET NULL,
    author_name VARCHAR(255),
    joined_by_judges UUID[], -- Array of judge IDs who joined
    per_curiam BOOLEAN DEFAULT FALSE,
    opinion_text TEXT,
    html_text TEXT,
    plain_text TEXT,
    sha1_hash VARCHAR(40),
    download_url TEXT,
    local_path TEXT,
    extracted_by_ocr BOOLEAN DEFAULT FALSE,
    date_created DATE,
    courtlistener_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create citations table
CREATE TABLE IF NOT EXISTS citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opinion_id UUID REFERENCES opinions(id) ON DELETE CASCADE,
    citation_type VARCHAR(50), -- 'federal', 'state', 'specialty', 'lexis', 'westlaw', 'neutral'
    volume INTEGER,
    reporter VARCHAR(100),
    page VARCHAR(50),
    citation_string VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create oral arguments table
CREATE TABLE IF NOT EXISTS oral_arguments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    docket_id UUID REFERENCES dockets(id) ON DELETE CASCADE,
    case_name VARCHAR(500),
    argument_date DATE,
    panel_judges UUID[], -- Array of judge IDs on the panel
    duration_minutes INTEGER,
    audio_url TEXT,
    transcript_url TEXT,
    courtlistener_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create financial disclosures table
CREATE TABLE IF NOT EXISTS judge_financial_disclosures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    report_type VARCHAR(50), -- 'annual', 'nominee', 'initial', 'final'
    filing_date DATE,
    pdf_url TEXT,
    has_investments BOOLEAN DEFAULT FALSE,
    investment_range VARCHAR(50), -- Ranges like '$15,001-$50,000'
    gifts_received TEXT[],
    outside_income DECIMAL(12,2),
    spouse_income BOOLEAN DEFAULT FALSE,
    courtlistener_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bulk data sync tracking
CREATE TABLE IF NOT EXISTS bulk_data_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_type VARCHAR(50) NOT NULL, -- 'judges', 'courts', 'opinions', 'dockets', 'full'
    source_file VARCHAR(500),
    s3_url TEXT,
    file_size_bytes BIGINT,
    records_total INTEGER,
    records_processed INTEGER,
    records_failed INTEGER,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'downloading', 'processing', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_log TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sync queue for rate-limited operations
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- 'judge', 'court', 'docket', 'opinion'
    entity_id VARCHAR(100) NOT NULL,
    operation VARCHAR(50) NOT NULL, -- 'fetch', 'update', 'delete'
    priority INTEGER DEFAULT 5, -- 1-10, 1 is highest
    status VARCHAR(50) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    next_attempt_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Judges indexes
CREATE INDEX IF NOT EXISTS idx_judges_judge_type ON judges(judge_type);
CREATE INDEX IF NOT EXISTS idx_judges_classification ON judges(classification);
CREATE INDEX IF NOT EXISTS idx_judges_federal_state ON judges(federal_judge, state_judge);
CREATE INDEX IF NOT EXISTS idx_judges_is_active ON judges(is_active);

-- Courts indexes
CREATE INDEX IF NOT EXISTS idx_courts_court_level ON courts(court_level);
CREATE INDEX IF NOT EXISTS idx_courts_court_system ON courts(court_system);
CREATE INDEX IF NOT EXISTS idx_courts_level ON courts(level);
CREATE INDEX IF NOT EXISTS idx_courts_parent ON courts(parent_court_id);

-- Dockets indexes
CREATE INDEX IF NOT EXISTS idx_dockets_court_id ON dockets(court_id);
CREATE INDEX IF NOT EXISTS idx_dockets_judge_id ON dockets(judge_id);
CREATE INDEX IF NOT EXISTS idx_dockets_date_filed ON dockets(date_filed);
CREATE INDEX IF NOT EXISTS idx_dockets_status ON dockets(status);
CREATE INDEX IF NOT EXISTS idx_dockets_courtlistener_id ON dockets(courtlistener_id);

-- Docket entries indexes
CREATE INDEX IF NOT EXISTS idx_docket_entries_docket_id ON docket_entries(docket_id);
CREATE INDEX IF NOT EXISTS idx_docket_entries_date_filed ON docket_entries(date_filed);

-- Parties indexes
CREATE INDEX IF NOT EXISTS idx_parties_docket_id ON parties(docket_id);
CREATE INDEX IF NOT EXISTS idx_parties_party_type ON parties(party_type);

-- Case attorneys indexes
CREATE INDEX IF NOT EXISTS idx_case_attorneys_docket_id ON case_attorneys(docket_id);
CREATE INDEX IF NOT EXISTS idx_case_attorneys_bar_number ON case_attorneys(bar_number);

-- Judicial positions indexes
CREATE INDEX IF NOT EXISTS idx_judicial_positions_judge_id ON judicial_positions(judge_id);
CREATE INDEX IF NOT EXISTS idx_judicial_positions_court_id ON judicial_positions(court_id);
CREATE INDEX IF NOT EXISTS idx_judicial_positions_is_current ON judicial_positions(is_current);
CREATE INDEX IF NOT EXISTS idx_judicial_positions_classification ON judicial_positions(classification);

-- Opinions indexes
CREATE INDEX IF NOT EXISTS idx_opinions_case_id ON opinions(case_id);
CREATE INDEX IF NOT EXISTS idx_opinions_author_judge_id ON opinions(author_judge_id);
CREATE INDEX IF NOT EXISTS idx_opinions_courtlistener_id ON opinions(courtlistener_id);

-- Sync queue indexes
CREATE INDEX IF NOT EXISTS idx_sync_queue_status_priority ON sync_queue(status, priority);
CREATE INDEX IF NOT EXISTS idx_sync_queue_next_attempt ON sync_queue(next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);

-- Bulk import indexes
CREATE INDEX IF NOT EXISTS idx_bulk_imports_status ON bulk_data_imports(status);
CREATE INDEX IF NOT EXISTS idx_bulk_imports_type ON bulk_data_imports(import_type);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

ALTER TABLE dockets ENABLE ROW LEVEL SECURITY;
ALTER TABLE docket_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_attorneys ENABLE ROW LEVEL SECURITY;
ALTER TABLE judicial_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_career_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE opinions ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE oral_arguments ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_financial_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- Public read access for most data
CREATE POLICY "Dockets are viewable by everyone" ON dockets FOR SELECT USING (true);
CREATE POLICY "Docket entries are viewable by everyone" ON docket_entries FOR SELECT USING (true);
CREATE POLICY "Parties are viewable by everyone" ON parties FOR SELECT USING (true);
CREATE POLICY "Case attorneys are viewable by everyone" ON case_attorneys FOR SELECT USING (true);
CREATE POLICY "Judicial positions are viewable by everyone" ON judicial_positions FOR SELECT USING (true);
CREATE POLICY "Judge education is viewable by everyone" ON judge_education FOR SELECT USING (true);
CREATE POLICY "Judge career history is viewable by everyone" ON judge_career_history FOR SELECT USING (true);
CREATE POLICY "Opinions are viewable by everyone" ON opinions FOR SELECT USING (true);
CREATE POLICY "Citations are viewable by everyone" ON citations FOR SELECT USING (true);
CREATE POLICY "Oral arguments are viewable by everyone" ON oral_arguments FOR SELECT USING (true);
CREATE POLICY "Financial disclosures are viewable by everyone" ON judge_financial_disclosures FOR SELECT USING (true);

-- Admin only for sync operations
CREATE POLICY "Bulk imports are admin only" ON bulk_data_imports
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Sync queue is admin only" ON sync_queue
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to get all judges by type
CREATE OR REPLACE FUNCTION get_judges_by_type(judge_type_filter judge_classification)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    court_name VARCHAR(255),
    judge_type VARCHAR(50),
    classification judge_classification,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.name,
        j.court_name,
        j.judge_type,
        j.classification,
        j.is_active
    FROM judges j
    WHERE j.classification = judge_type_filter
    AND j.is_active = true
    ORDER BY j.name;
END;
$$ LANGUAGE plpgsql;

-- Function to get court hierarchy
CREATE OR REPLACE FUNCTION get_court_hierarchy(court_id_param UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    level court_level_type,
    parent_court_id UUID,
    depth INTEGER
) AS $$
WITH RECURSIVE court_tree AS (
    SELECT c.id, c.name, c.level, c.parent_court_id, 0 as depth
    FROM courts c
    WHERE c.id = court_id_param
    
    UNION ALL
    
    SELECT c.id, c.name, c.level, c.parent_court_id, ct.depth + 1
    FROM courts c
    INNER JOIN court_tree ct ON c.parent_court_id = ct.id
)
SELECT * FROM court_tree ORDER BY depth;
$$ LANGUAGE sql;

-- Function to get judge's complete position history
CREATE OR REPLACE FUNCTION get_judge_position_history(judge_id_param UUID)
RETURNS TABLE (
    position_type VARCHAR(100),
    court_name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN,
    years_served NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jp.position_type,
        c.name as court_name,
        jp.start_date,
        jp.end_date,
        jp.is_current,
        ROUND(
            EXTRACT(EPOCH FROM (COALESCE(jp.end_date, CURRENT_DATE) - jp.start_date)) / 31536000, 
            1
        ) as years_served
    FROM judicial_positions jp
    LEFT JOIN courts c ON jp.court_id = c.id
    WHERE jp.judge_id = judge_id_param
    ORDER BY jp.start_date DESC;
END;
$$ LANGUAGE plpgsql;