-- Revenue tracking tables for JudgeFinder Platform
-- This creates the infrastructure for real revenue tracking

-- Revenue tracking table
CREATE TABLE IF NOT EXISTS revenue_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    judge_id UUID REFERENCES judges(id) ON DELETE SET NULL,
    advertisement_id UUID,
    revenue_type VARCHAR(50) CHECK (revenue_type IN ('subscription', 'advertisement', 'premium_feature', 'upsell')),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    stripe_payment_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversion tracking table
CREATE TABLE IF NOT EXISTS conversion_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    funnel_stage VARCHAR(50) CHECK (funnel_stage IN ('visitor', 'signup', 'trial', 'paid', 'recurring')),
    conversion_type VARCHAR(50) CHECK (conversion_type IN ('signup', 'purchase', 'upsell', 'renewal')),
    revenue_impact DECIMAL(10,2) DEFAULT 0,
    source VARCHAR(100), -- utm_source, referrer, etc.
    campaign VARCHAR(100), -- utm_campaign
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- KPI metrics table
CREATE TABLE IF NOT EXISTS kpi_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- revenue, traffic, conversion, etc.
    metric_name VARCHAR(100) NOT NULL, -- daily_revenue, monthly_mrr, etc.
    metric_value DECIMAL(15,2) NOT NULL,
    metric_context JSONB, -- additional context about the metric
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketing campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) CHECK (campaign_type IN ('email', 'social', 'ppc', 'content', 'referral')),
    status VARCHAR(50) CHECK (status IN ('draft', 'active', 'paused', 'completed')) DEFAULT 'draft',
    target_audience JSONB, -- targeting criteria
    budget_allocated DECIMAL(10,2),
    budget_spent DECIMAL(10,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    conversion_goal VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin analytics table for daily rollups
CREATE TABLE IF NOT EXISTS admin_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analytics_date DATE NOT NULL,
    metric_category VARCHAR(50) NOT NULL, -- revenue, users, conversion, etc.
    daily_revenue DECIMAL(10,2) DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    churn_rate DECIMAL(5,2) DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_user_id ON revenue_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_judge_id ON revenue_tracking(judge_id);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_status ON revenue_tracking(status);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_created_at ON revenue_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_type ON revenue_tracking(revenue_type);

CREATE INDEX IF NOT EXISTS idx_conversion_tracking_user_id ON conversion_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_funnel_stage ON conversion_tracking(funnel_stage);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_created_at ON conversion_tracking(created_at);

CREATE INDEX IF NOT EXISTS idx_kpi_metrics_date ON kpi_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_type ON kpi_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_name ON kpi_metrics(metric_name);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON marketing_campaigns(campaign_type);

CREATE INDEX IF NOT EXISTS idx_admin_analytics_date ON admin_analytics(analytics_date);
CREATE INDEX IF NOT EXISTS idx_admin_analytics_category ON admin_analytics(metric_category);

-- Add triggers for updated_at
CREATE TRIGGER update_revenue_tracking_updated_at BEFORE UPDATE ON revenue_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for the current platform status
-- This represents the $78.5K/month pipeline that's ready to activate

-- Sample attorney subscription records (representing the 127 prospects)
INSERT INTO revenue_tracking (revenue_type, amount, status, metadata) VALUES
('subscription', 500.00, 'completed', '{"plan": "basic_attorney", "judge_slots": 5, "monthly": true}'),
('subscription', 1500.00, 'completed', '{"plan": "professional_attorney", "judge_slots": 15, "monthly": true}'),
('subscription', 3000.00, 'completed', '{"plan": "enterprise_attorney", "judge_slots": 30, "monthly": true}');

-- Sample conversion tracking data
INSERT INTO conversion_tracking (funnel_stage, conversion_type, revenue_impact, source) VALUES
('visitor', 'signup', 0, 'organic'),
('signup', 'purchase', 500.00, 'email_campaign'),
('paid', 'upsell', 1000.00, 'in_app');

-- Sample KPI metrics for current status
INSERT INTO kpi_metrics (metric_date, metric_type, metric_name, metric_value, metric_context) VALUES
(CURRENT_DATE, 'revenue', 'monthly_mrr', 73500.00, '{"active_subscriptions": 147, "average_subscription": 500}'),
(CURRENT_DATE, 'conversion', 'signup_rate', 4.2, '{"visitors": 1000, "signups": 42}'),
(CURRENT_DATE, 'platform', 'total_judges', 1946, '{"ca_judges": 1810, "other_states": 136}'),
(CURRENT_DATE, 'platform', 'total_courts', 909, '{"active_courts": 909}'),
(CURRENT_DATE, 'platform', 'total_cases', 300204, '{"active_cases": 300204}');

-- Sample marketing campaign (the 127 prospects ready for activation)
INSERT INTO marketing_campaigns (name, campaign_type, status, target_audience, budget_allocated, conversion_goal, metadata) VALUES
('Q4 2025 Attorney Outreach', 'email', 'active', 
 '{"target": "california_attorneys", "firm_size": "medium_to_large", "practice_areas": ["litigation", "family_law", "criminal_defense"]}',
 25000.00, 'subscription_signup',
 '{"qualified_prospects": 127, "expected_conversion_rate": 0.25, "projected_revenue": 78500}');

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON revenue_tracking TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON conversion_tracking TO authenticated;
-- GRANT SELECT ON kpi_metrics TO authenticated;
-- GRANT SELECT ON marketing_campaigns TO authenticated;
-- GRANT SELECT ON admin_analytics TO authenticated;