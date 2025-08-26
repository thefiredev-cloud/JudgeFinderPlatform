-- Add court_level to judges table to distinguish between federal and state judges
ALTER TABLE judges 
ADD COLUMN IF NOT EXISTS court_level VARCHAR(20) DEFAULT 'state' 
CHECK (court_level IN ('federal', 'state'));

-- Update existing judges based on court name patterns
UPDATE judges 
SET court_level = 'federal'
WHERE court_name ILIKE '%federal%' 
   OR court_name ILIKE '%u.s.%' 
   OR court_name ILIKE '%united states%'
   OR court_name ILIKE '%bankruptcy%';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_judges_court_level ON judges(court_level);

-- Add court_level to ad_spots for easier pricing management
ALTER TABLE ad_spots 
ADD COLUMN IF NOT EXISTS court_level VARCHAR(20);

-- Update ad_spots based on judge court_level
UPDATE ad_spots 
SET court_level = j.court_level
FROM judges j
WHERE ad_spots.entity_type = 'judge' 
  AND ad_spots.entity_id = j.id;

-- Update base prices based on court level
UPDATE ad_spots 
SET base_price_monthly = CASE 
    WHEN court_level = 'federal' THEN 500.00
    WHEN court_level = 'state' THEN 200.00
    ELSE base_price_monthly
END
WHERE entity_type = 'judge';

-- Add pricing_tier column for more flexible pricing options
ALTER TABLE ad_spots 
ADD COLUMN IF NOT EXISTS pricing_tier VARCHAR(50) DEFAULT 'standard';

-- Create a pricing_tiers table for centralized pricing management
CREATE TABLE IF NOT EXISTS pricing_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier_name VARCHAR(50) UNIQUE NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    court_level VARCHAR(20),
    monthly_price DECIMAL(10,2) NOT NULL,
    annual_price DECIMAL(10,2) NOT NULL,
    annual_discount_months INTEGER DEFAULT 2,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default pricing tiers
INSERT INTO pricing_tiers (tier_name, entity_type, court_level, monthly_price, annual_price, annual_discount_months, features) 
VALUES 
    ('federal_judge_standard', 'judge', 'federal', 500.00, 5000.00, 2, 
     '{"placement": "premium", "analytics": "advanced", "support": "priority", "visibility": "high"}'::jsonb),
    ('state_judge_standard', 'judge', 'state', 200.00, 2000.00, 2, 
     '{"placement": "standard", "analytics": "detailed", "support": "email", "visibility": "standard"}'::jsonb),
    ('court_standard', 'court', NULL, 300.00, 3000.00, 2, 
     '{"placement": "standard", "analytics": "detailed", "support": "email", "visibility": "standard"}'::jsonb)
ON CONFLICT (tier_name) DO NOTHING;

-- Add column to track pricing tier in bookings
ALTER TABLE ad_bookings 
ADD COLUMN IF NOT EXISTS pricing_tier_id UUID REFERENCES pricing_tiers(id),
ADD COLUMN IF NOT EXISTS is_annual BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS months_purchased INTEGER DEFAULT 1;

-- Create function to calculate pricing based on tier and duration
CREATE OR REPLACE FUNCTION calculate_ad_pricing(
    p_tier_name VARCHAR,
    p_months INTEGER
) RETURNS TABLE (
    total_price DECIMAL,
    monthly_rate DECIMAL,
    savings DECIMAL
) AS $$
DECLARE
    v_tier pricing_tiers%ROWTYPE;
BEGIN
    SELECT * INTO v_tier FROM pricing_tiers WHERE tier_name = p_tier_name AND is_active = true;
    
    IF v_tier IS NULL THEN
        RAISE EXCEPTION 'Pricing tier not found: %', p_tier_name;
    END IF;
    
    IF p_months >= 12 THEN
        -- Annual pricing with discount
        RETURN QUERY SELECT 
            v_tier.annual_price,
            v_tier.annual_price / 12,
            (v_tier.monthly_price * 12) - v_tier.annual_price;
    ELSE
        -- Monthly pricing
        RETURN QUERY SELECT 
            v_tier.monthly_price * p_months,
            v_tier.monthly_price,
            0::DECIMAL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pricing_tiers_updated_at 
    BEFORE UPDATE ON pricing_tiers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();