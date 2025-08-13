-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Courts table
CREATE TABLE courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('federal', 'state', 'local')),
    jurisdiction VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    website VARCHAR(255),
    judge_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Judges table
CREATE TABLE judges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
    court_name VARCHAR(255),
    jurisdiction VARCHAR(100),
    appointed_date DATE,
    education TEXT,
    profile_image_url VARCHAR(500),
    bio TEXT,
    total_cases INTEGER DEFAULT 0,
    reversal_rate DECIMAL(3,2) DEFAULT 0.00,
    average_decision_time INTEGER, -- in days
    courtlistener_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cases table
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(100) UNIQUE NOT NULL,
    case_name VARCHAR(500) NOT NULL,
    judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
    court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
    case_type VARCHAR(100),
    filing_date DATE NOT NULL,
    decision_date DATE,
    status VARCHAR(50) CHECK (status IN ('pending', 'decided', 'settled', 'dismissed')),
    outcome TEXT,
    summary TEXT,
    courtlistener_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'attorney', 'admin')),
    phone VARCHAR(20),
    company VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attorneys table (for attorney profiles)
CREATE TABLE attorneys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bar_number VARCHAR(50),
    firm_name VARCHAR(255),
    specialty VARCHAR(100),
    years_experience INTEGER,
    cases_won INTEGER DEFAULT 0,
    cases_total INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0.0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attorney slots for advertising
CREATE TABLE attorney_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
    attorney_id UUID REFERENCES attorneys(id) ON DELETE SET NULL,
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 4),
    start_date DATE NOT NULL,
    end_date DATE,
    price_per_month DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(judge_id, position)
);

-- Search history
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    search_query TEXT NOT NULL,
    search_type VARCHAR(50),
    results_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics events
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
    plan_type VARCHAR(50) CHECK (plan_type IN ('basic', 'professional', 'enterprise')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_judges_name ON judges(name);
CREATE INDEX idx_judges_court_id ON judges(court_id);
CREATE INDEX idx_judges_jurisdiction ON judges(jurisdiction);
CREATE INDEX idx_judges_name_trgm ON judges USING gin (name gin_trgm_ops);

CREATE INDEX idx_cases_judge_id ON cases(judge_id);
CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_filing_date ON cases(filing_date);

CREATE INDEX idx_attorney_slots_judge_id ON attorney_slots(judge_id);
CREATE INDEX idx_attorney_slots_attorney_id ON attorney_slots(attorney_id);
CREATE INDEX idx_attorney_slots_active ON attorney_slots(is_active);

CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON courts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_judges_updated_at BEFORE UPDATE ON judges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attorneys_updated_at BEFORE UPDATE ON attorneys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attorney_slots_updated_at BEFORE UPDATE ON attorney_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function for full-text search on judges
CREATE OR REPLACE FUNCTION search_judges(
    search_query TEXT,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    court_name VARCHAR(255),
    jurisdiction VARCHAR(100),
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.name,
        j.court_name,
        j.jurisdiction,
        similarity(j.name, search_query) AS similarity
    FROM judges j
    WHERE j.name % search_query
    ORDER BY similarity DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attorneys ENABLE ROW LEVEL SECURITY;
ALTER TABLE attorney_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Public read access for courts and judges
CREATE POLICY "Courts are viewable by everyone" ON courts
    FOR SELECT USING (true);

CREATE POLICY "Judges are viewable by everyone" ON judges
    FOR SELECT USING (true);

CREATE POLICY "Cases are viewable by everyone" ON cases
    FOR SELECT USING (true);

-- Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Attorneys can manage their own profiles
CREATE POLICY "Attorneys can view own profile" ON attorneys
    FOR SELECT USING (auth.uid() = user_id OR true); -- Public attorney profiles

CREATE POLICY "Attorneys can update own profile" ON attorneys
    FOR UPDATE USING (auth.uid() = user_id);

-- Attorney slots are publicly viewable
CREATE POLICY "Attorney slots are viewable by everyone" ON attorney_slots
    FOR SELECT USING (true);

-- Only attorneys can create/update their own slots
CREATE POLICY "Attorneys can manage own slots" ON attorney_slots
    FOR ALL USING (
        attorney_id IN (
            SELECT id FROM attorneys WHERE user_id = auth.uid()
        )
    );

-- Users can only see their own search history
CREATE POLICY "Users can view own search history" ON search_history
    FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions are private to users
CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);