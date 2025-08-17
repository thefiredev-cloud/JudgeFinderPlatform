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
    courtlistener_id VARCHAR(100) UNIQUE,
    courthouse_metadata JSONB, -- Detailed courthouse information for Orange County targeting
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
    courtlistener_data JSONB, -- Full CourtListener judge data
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
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 3),
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
CREATE INDEX idx_judges_courtlistener_id ON judges(courtlistener_id);
CREATE INDEX idx_judges_name_trgm ON judges USING gin (name gin_trgm_ops);
CREATE INDEX idx_judges_courtlistener_data ON judges USING gin (courtlistener_data);
CREATE INDEX idx_judges_courtlistener_data_educations ON judges USING gin ((courtlistener_data->'educations'));
CREATE INDEX idx_judges_courtlistener_data_positions ON judges USING gin ((courtlistener_data->'positions'));

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

-- ========================================
-- MISSING CRITICAL TABLES - PHASE 2/5D INTEGRATION
-- ========================================

-- Law firms table for Orange County attorney marketing intelligence
CREATE TABLE IF NOT EXISTS law_firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    firm_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    bar_number VARCHAR(50) NOT NULL,
    bar_state VARCHAR(10) NOT NULL,
    logo_url TEXT,
    website VARCHAR(255),
    specializations TEXT[],
    years_practicing INTEGER,
    practice_areas TEXT[],
    description TEXT,
    verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    -- Marketing intelligence fields
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50) DEFAULT 'CA',
    zip_code VARCHAR(10),
    employee_count_range VARCHAR(50), -- '1-5', '6-20', '21-50', '51-200', '200+'
    target_priority INTEGER DEFAULT 1 CHECK (target_priority BETWEEN 1 AND 5), -- 5 = highest priority
    revenue_estimate DECIMAL(12,2), -- Annual revenue estimate
    marketing_budget_estimate DECIMAL(10,2), -- Monthly marketing budget estimate
    decision_makers JSONB, -- Key contacts for sales outreach
    competitive_intelligence JSONB, -- Current marketing strategies, competitors
    notes TEXT, -- Sales notes and relationship status
    last_contact_date DATE,
    next_followup_date DATE,
    relationship_status VARCHAR(50) DEFAULT 'prospect', -- prospect, contacted, qualified, customer, lost
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Advertisements table for tracking ad placements
CREATE TABLE IF NOT EXISTS advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 5),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'expired')),
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_rate DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    stripe_subscription_id VARCHAR(255),
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(judge_id, position, start_date)
);

-- Payment history table for billing tracking
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    amount INTEGER NOT NULL, -- in cents
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(20) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Revenue tracking table for comprehensive financial management
CREATE TABLE IF NOT EXISTS revenue_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    judge_id UUID REFERENCES judges(id) ON DELETE SET NULL,
    advertisement_id UUID REFERENCES advertisements(id) ON DELETE SET NULL,
    revenue_type VARCHAR(50) NOT NULL, -- 'subscription', 'one_time', 'upsell', 'recovery'
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    payment_method VARCHAR(50), -- 'stripe', 'manual', 'wire'
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    stripe_payment_id VARCHAR(255),
    billing_period_start DATE,
    billing_period_end DATE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Law firms indexes
CREATE INDEX IF NOT EXISTS idx_law_firms_user_id ON law_firms(user_id);
CREATE INDEX IF NOT EXISTS idx_law_firms_verification_status ON law_firms(verification_status);
CREATE INDEX IF NOT EXISTS idx_law_firms_city ON law_firms(city);
CREATE INDEX IF NOT EXISTS idx_law_firms_target_priority ON law_firms(target_priority);
CREATE INDEX IF NOT EXISTS idx_law_firms_practice_areas ON law_firms USING gin (practice_areas);
CREATE INDEX IF NOT EXISTS idx_law_firms_relationship_status ON law_firms(relationship_status);

-- Advertisements indexes
CREATE INDEX IF NOT EXISTS idx_advertisements_user_id ON advertisements(user_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_judge_id ON advertisements(judge_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_status ON advertisements(status);

-- Payment history indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);

-- Revenue tracking indexes
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_user_id ON revenue_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_judge_id ON revenue_tracking(judge_id);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_status ON revenue_tracking(status);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_created_at ON revenue_tracking(created_at DESC);

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

ALTER TABLE law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_tracking ENABLE ROW LEVEL SECURITY;

-- Law firms policies
CREATE POLICY "Users can view own firm" ON law_firms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own firm" ON law_firms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own firm" ON law_firms
    FOR UPDATE USING (auth.uid() = user_id);

-- Advertisements policies
CREATE POLICY "Advertisements are viewable by everyone" ON advertisements
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own advertisements" ON advertisements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own advertisements" ON advertisements
    FOR UPDATE USING (auth.uid() = user_id);

-- Payment history policies
CREATE POLICY "Users can view own payment history" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

-- Revenue tracking policies
CREATE POLICY "Users can view own revenue tracking" ON revenue_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- Add missing fields to attorneys table for verification workflow
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS bar_state VARCHAR(10);
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS verification_files JSONB;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE;

-- KPI tracking table for live dashboard metrics
CREATE TABLE IF NOT EXISTS kpi_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'conversion', 'revenue', 'engagement', 'retention'
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_context JSONB, -- Additional context data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversion tracking table for funnel optimization
CREATE TABLE IF NOT EXISTS conversion_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    funnel_stage VARCHAR(50) NOT NULL, -- 'visitor', 'signup', 'verification', 'first_ad', 'recurring'
    conversion_type VARCHAR(50), -- 'signup', 'verification', 'purchase', 'upsell'
    source VARCHAR(100), -- 'organic', 'paid', 'referral', 'direct'
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    revenue_impact DECIMAL(10,2) DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Campaign tracking for prospect targeting
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL, -- 'email', 'cold_outreach', 'retargeting', 'content'
    target_audience VARCHAR(100), -- 'orange_county_firms', 'la_county_firms', 'high_value'
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    budget DECIMAL(10,2),
    spent DECIMAL(10,2) DEFAULT 0,
    prospects_targeted INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Campaign prospects junction table
CREATE TABLE IF NOT EXISTS campaign_prospects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    firm_id UUID REFERENCES law_firms(id) ON DELETE CASCADE,
    contact_email VARCHAR(255),
    contact_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'contacted', 'engaged', 'converted', 'lost'
    last_contact_date TIMESTAMP WITH TIME ZONE,
    next_followup_date TIMESTAMP WITH TIME ZONE,
    engagement_score INTEGER DEFAULT 0, -- 0-100 score
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email automation sequences
CREATE TABLE IF NOT EXISTS email_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_name VARCHAR(255) NOT NULL,
    sequence_type VARCHAR(50) NOT NULL, -- 'welcome', 'recovery', 'upsell', 'nurture'
    trigger_event VARCHAR(100), -- 'signup', 'failed_payment', 'high_engagement'
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email sequence steps
CREATE TABLE IF NOT EXISTS email_sequence_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    delay_hours INTEGER NOT NULL, -- Hours to wait after previous step
    email_subject VARCHAR(500) NOT NULL,
    email_template TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email send log
CREATE TABLE IF NOT EXISTS email_send_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sequence_id UUID REFERENCES email_sequences(id) ON DELETE SET NULL,
    step_id UUID REFERENCES email_sequence_steps(id) ON DELETE SET NULL,
    email_to VARCHAR(255) NOT NULL,
    email_subject VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced'
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin analytics aggregations
CREATE TABLE IF NOT EXISTS admin_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analytics_date DATE NOT NULL,
    metric_category VARCHAR(50) NOT NULL, -- 'revenue', 'users', 'engagement', 'conversion'
    daily_revenue DECIMAL(10,2),
    monthly_revenue DECIMAL(10,2),
    annual_revenue DECIMAL(10,2),
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    churned_users INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2),
    average_order_value DECIMAL(10,2),
    lifetime_value DECIMAL(10,2),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Billing automations table
CREATE TABLE IF NOT EXISTS billing_automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    automation_type VARCHAR(50) NOT NULL, -- 'failed_payment_recovery', 'subscription_renewal', 'upsell'
    trigger_event VARCHAR(100), -- 'payment_failed', 'subscription_ending', 'high_engagement'
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    automation_config JSONB, -- Configuration for the automation
    last_executed TIMESTAMP WITH TIME ZONE,
    next_execution TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- ADDITIONAL INDEXES FOR REVENUE SYSTEM
-- ========================================

-- Attorneys verification indexes
CREATE INDEX IF NOT EXISTS idx_attorneys_verification_status ON attorneys(verification_status);
CREATE INDEX IF NOT EXISTS idx_attorneys_bar_number ON attorneys(bar_number);

-- KPI metrics indexes
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_date ON kpi_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_type ON kpi_metrics(metric_type);

-- Conversion tracking indexes
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_user_id ON conversion_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_funnel_stage ON conversion_tracking(funnel_stage);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_source ON conversion_tracking(source);

-- Marketing campaigns indexes
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_target_audience ON marketing_campaigns(target_audience);

-- Campaign prospects indexes
CREATE INDEX IF NOT EXISTS idx_campaign_prospects_campaign_id ON campaign_prospects(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_prospects_firm_id ON campaign_prospects(firm_id);
CREATE INDEX IF NOT EXISTS idx_campaign_prospects_status ON campaign_prospects(status);

-- Email sequences indexes
CREATE INDEX IF NOT EXISTS idx_email_sequences_status ON email_sequences(status);
CREATE INDEX IF NOT EXISTS idx_email_sequences_trigger_event ON email_sequences(trigger_event);

-- Email send log indexes
CREATE INDEX IF NOT EXISTS idx_email_send_log_user_id ON email_send_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_send_log_status ON email_send_log(status);

-- Admin analytics indexes
CREATE INDEX IF NOT EXISTS idx_admin_analytics_date ON admin_analytics(analytics_date DESC);
CREATE INDEX IF NOT EXISTS idx_admin_analytics_category ON admin_analytics(metric_category);

-- Billing automations indexes
CREATE INDEX IF NOT EXISTS idx_billing_automations_user_id ON billing_automations(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_automations_status ON billing_automations(status);
CREATE INDEX IF NOT EXISTS idx_billing_automations_next_execution ON billing_automations(next_execution);

-- ========================================
-- ROW LEVEL SECURITY FOR NEW TABLES
-- ========================================

-- Enable RLS on new tables
ALTER TABLE kpi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_automations ENABLE ROW LEVEL SECURITY;

-- Admin-only access for system metrics
CREATE POLICY "Admin access for KPI metrics" ON kpi_metrics
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Users can view their own conversion data
CREATE POLICY "Users can view own conversion data" ON conversion_tracking
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Admin access for campaigns
CREATE POLICY "Admin access for marketing campaigns" ON marketing_campaigns
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Admin access for campaign prospects" ON campaign_prospects
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Email sequences are admin-managed
CREATE POLICY "Admin access for email sequences" ON email_sequences
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Admin access for email sequence steps" ON email_sequence_steps
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs" ON email_send_log
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Admin analytics are admin-only
CREATE POLICY "Admin access for admin analytics" ON admin_analytics
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Users can view their own billing automations
CREATE POLICY "Users can view own billing automations" ON billing_automations
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Performance metrics table for analytics tracking
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_delta DECIMAL(10,2),
    metric_id VARCHAR(255),
    rating VARCHAR(50),
    page_url TEXT NOT NULL,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    page_type VARCHAR(100),
    connection_type VARCHAR(50),
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics indexes
CREATE INDEX idx_performance_metrics_page_url ON performance_metrics(page_url);
CREATE INDEX idx_performance_metrics_metric_name ON performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);