-- =====================================================
-- Advertising Management System for JudgeFinder Platform
-- =====================================================
-- This migration creates the infrastructure for law firms and attorneys
-- to manage advertising spots on judge and court profiles

-- 1. Advertiser Profiles Table
-- Extended profile information for law firms and attorneys who advertise
CREATE TABLE IF NOT EXISTS advertiser_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    firm_name VARCHAR(255) NOT NULL,
    firm_type VARCHAR(50) CHECK (firm_type IN ('solo', 'small', 'medium', 'large', 'enterprise')),
    bar_number VARCHAR(50),
    bar_state VARCHAR(10) DEFAULT 'CA',
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    billing_email VARCHAR(255),
    billing_address TEXT,
    website VARCHAR(255),
    logo_url TEXT,
    description TEXT,
    specializations TEXT[],
    total_spend DECIMAL(10,2) DEFAULT 0,
    account_status VARCHAR(50) DEFAULT 'pending' CHECK (account_status IN ('pending', 'active', 'suspended', 'inactive')),
    verification_status VARCHAR(50) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Ad Spots Table
-- Tracks all available advertising positions on judge and court profiles
CREATE TABLE IF NOT EXISTS ad_spots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('judge', 'court')),
    entity_id UUID NOT NULL, -- References either judges.id or courts.id
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 3),
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'booked', 'reserved', 'maintenance')),
    base_price_monthly DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    current_advertiser_id UUID REFERENCES advertiser_profiles(id) ON DELETE SET NULL,
    impressions_total INTEGER DEFAULT 0,
    clicks_total INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, entity_id, position)
);

-- 3. Ad Campaigns Table
-- Manages advertising campaigns created by advertisers
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_id UUID REFERENCES advertiser_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) CHECK (campaign_type IN ('standard', 'premium', 'sponsored')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'active', 'paused', 'completed', 'rejected')),
    budget_total DECIMAL(10,2) NOT NULL,
    budget_spent DECIMAL(10,2) DEFAULT 0,
    budget_daily_limit DECIMAL(10,2),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    targeting_criteria JSONB, -- Store targeting preferences (jurisdictions, court types, etc.)
    ad_content JSONB, -- Store ad creative content (title, description, CTA, etc.)
    impressions_total INTEGER DEFAULT 0,
    clicks_total INTEGER DEFAULT 0,
    approval_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date > start_date),
    CHECK (budget_spent <= budget_total)
);

-- 4. Ad Bookings Table
-- Records individual ad slot bookings
CREATE TABLE IF NOT EXISTS ad_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_spot_id UUID REFERENCES ad_spots(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    advertiser_id UUID REFERENCES advertiser_profiles(id) ON DELETE CASCADE,
    booking_status VARCHAR(50) DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'active', 'expired', 'cancelled')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price_paid DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    stripe_payment_intent_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date > start_date)
);

-- 5. Ad Performance Metrics Table
-- Daily rollup of ad performance metrics
CREATE TABLE IF NOT EXISTS ad_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES ad_bookings(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr DECIMAL(5,2) DEFAULT 0, -- Click-through rate
    conversions INTEGER DEFAULT 0,
    conversion_value DECIMAL(10,2) DEFAULT 0,
    spend DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(booking_id, metric_date)
);

-- 6. Ad Creative Assets Table
-- Store ad creative content and assets
CREATE TABLE IF NOT EXISTS ad_creatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    creative_type VARCHAR(50) CHECK (creative_type IN ('text', 'image', 'rich')),
    headline VARCHAR(100) NOT NULL,
    description TEXT,
    cta_text VARCHAR(50), -- Call to action text
    cta_url VARCHAR(500),
    image_url VARCHAR(500),
    badge_text VARCHAR(50), -- e.g., "Featured", "Sponsored"
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Billing Transactions Table
-- Track all billing transactions
CREATE TABLE IF NOT EXISTS billing_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_id UUID REFERENCES advertiser_profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES ad_bookings(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) CHECK (transaction_type IN ('charge', 'refund', 'credit', 'adjustment')),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    stripe_charge_id VARCHAR(255),
    stripe_refund_id VARCHAR(255),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_advertiser_profiles_user_id ON advertiser_profiles(user_id);
CREATE INDEX idx_advertiser_profiles_status ON advertiser_profiles(account_status);
CREATE INDEX idx_advertiser_profiles_verification ON advertiser_profiles(verification_status);

CREATE INDEX idx_ad_spots_entity ON ad_spots(entity_type, entity_id);
CREATE INDEX idx_ad_spots_status ON ad_spots(status);
CREATE INDEX idx_ad_spots_advertiser ON ad_spots(current_advertiser_id);

CREATE INDEX idx_ad_campaigns_advertiser ON ad_campaigns(advertiser_id);
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);

CREATE INDEX idx_ad_bookings_spot ON ad_bookings(ad_spot_id);
CREATE INDEX idx_ad_bookings_campaign ON ad_bookings(campaign_id);
CREATE INDEX idx_ad_bookings_advertiser ON ad_bookings(advertiser_id);
CREATE INDEX idx_ad_bookings_status ON ad_bookings(booking_status);
CREATE INDEX idx_ad_bookings_dates ON ad_bookings(start_date, end_date);

CREATE INDEX idx_ad_performance_date ON ad_performance_metrics(metric_date);
CREATE INDEX idx_ad_performance_booking ON ad_performance_metrics(booking_id);
CREATE INDEX idx_ad_performance_campaign ON ad_performance_metrics(campaign_id);

CREATE INDEX idx_billing_advertiser ON billing_transactions(advertiser_id);
CREATE INDEX idx_billing_booking ON billing_transactions(booking_id);
CREATE INDEX idx_billing_status ON billing_transactions(status);

-- Create triggers for updated_at columns
CREATE TRIGGER update_advertiser_profiles_updated_at BEFORE UPDATE ON advertiser_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_spots_updated_at BEFORE UPDATE ON ad_spots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_campaigns_updated_at BEFORE UPDATE ON ad_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_bookings_updated_at BEFORE UPDATE ON ad_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_creatives_updated_at BEFORE UPDATE ON ad_creatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE advertiser_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;

-- Advertiser profiles: Users can manage their own profile
CREATE POLICY "Users can view own advertiser profile" ON advertiser_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own advertiser profile" ON advertiser_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own advertiser profile" ON advertiser_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ad spots: Public read, admin write
CREATE POLICY "Ad spots are viewable by everyone" ON ad_spots
    FOR SELECT USING (true);

-- Campaigns: Advertisers can manage their own campaigns
CREATE POLICY "Advertisers can view own campaigns" ON ad_campaigns
    FOR SELECT USING (
        advertiser_id IN (
            SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Advertisers can create campaigns" ON ad_campaigns
    FOR INSERT WITH CHECK (
        advertiser_id IN (
            SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Advertisers can update own campaigns" ON ad_campaigns
    FOR UPDATE USING (
        advertiser_id IN (
            SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
        )
    );

-- Bookings: Advertisers can view and manage their own bookings
CREATE POLICY "Advertisers can view own bookings" ON ad_bookings
    FOR SELECT USING (
        advertiser_id IN (
            SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Advertisers can create bookings" ON ad_bookings
    FOR INSERT WITH CHECK (
        advertiser_id IN (
            SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
        )
    );

-- Performance metrics: Advertisers can view their own metrics
CREATE POLICY "Advertisers can view own metrics" ON ad_performance_metrics
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM ad_campaigns WHERE advertiser_id IN (
                SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Creatives: Advertisers can manage their own creatives
CREATE POLICY "Advertisers can view own creatives" ON ad_creatives
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM ad_campaigns WHERE advertiser_id IN (
                SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Advertisers can manage own creatives" ON ad_creatives
    FOR ALL USING (
        campaign_id IN (
            SELECT id FROM ad_campaigns WHERE advertiser_id IN (
                SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Billing: Advertisers can view their own transactions
CREATE POLICY "Advertisers can view own transactions" ON billing_transactions
    FOR SELECT USING (
        advertiser_id IN (
            SELECT id FROM advertiser_profiles WHERE user_id = auth.uid()
        )
    );

-- Function to populate ad spots for all existing judges and courts
CREATE OR REPLACE FUNCTION populate_ad_spots()
RETURNS void AS $$
BEGIN
    -- Create 3 ad spots for each judge
    INSERT INTO ad_spots (entity_type, entity_id, position, base_price_monthly)
    SELECT 
        'judge' as entity_type,
        j.id as entity_id,
        p.position,
        CASE 
            WHEN j.total_cases > 1000 THEN 1500.00
            WHEN j.total_cases > 500 THEN 1000.00
            ELSE 500.00
        END as base_price_monthly
    FROM judges j
    CROSS JOIN (SELECT 1 as position UNION SELECT 2 UNION SELECT 3) p
    ON CONFLICT (entity_type, entity_id, position) DO NOTHING;
    
    -- Create 3 ad spots for each court
    INSERT INTO ad_spots (entity_type, entity_id, position, base_price_monthly)
    SELECT 
        'court' as entity_type,
        c.id as entity_id,
        p.position,
        CASE 
            WHEN c.judge_count > 50 THEN 2000.00
            WHEN c.judge_count > 20 THEN 1500.00
            ELSE 750.00
        END as base_price_monthly
    FROM courts c
    CROSS JOIN (SELECT 1 as position UNION SELECT 2 UNION SELECT 3) p
    ON CONFLICT (entity_type, entity_id, position) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to populate ad spots
SELECT populate_ad_spots();

-- Grant permissions for authenticated users
GRANT SELECT ON ad_spots TO authenticated;
GRANT SELECT, INSERT, UPDATE ON advertiser_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ad_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ad_bookings TO authenticated;
GRANT SELECT ON ad_performance_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ad_creatives TO authenticated;
GRANT SELECT ON billing_transactions TO authenticated;