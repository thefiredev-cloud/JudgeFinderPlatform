-- Refresh pricing tier catalog for Verified Listing tiers A–D with new pricing model

BEGIN;

-- Ensure required columns exist
ALTER TABLE pricing_tiers
  ADD COLUMN IF NOT EXISTS tier_group VARCHAR(32),
  ADD COLUMN IF NOT EXISTS purchase_type VARCHAR(32) DEFAULT 'subscription';

-- Deactivate legacy rows instead of deleting
UPDATE pricing_tiers
SET is_active = false,
    updated_at = CURRENT_TIMESTAMP
WHERE tier_name IN ('federal_judge_premium', 'state_judge_standard', 'court_standard');

-- Upsert new tier structure for judge listings
INSERT INTO pricing_tiers (
  id,
  tier_name,
  entity_type,
  court_level,
  monthly_price,
  annual_price,
  annual_discount_months,
  features,
  tier_group,
  purchase_type,
  is_active,
  created_at,
  updated_at
) VALUES
  (uuid_generate_v4(), 'verified_listing_tier_a', 'judge', 'state', 449.00, 4490.00, 10,
    '{"placement": "premium", "analytics": "full", "support": "priority", "visibility": "flagship"}'::jsonb,
    'verified_listing', 'subscription', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'verified_listing_tier_b', 'judge', 'state', 299.00, 2990.00, 10,
    '{"placement": "premium", "analytics": "enhanced", "support": "priority", "visibility": "major_county"}'::jsonb,
    'verified_listing', 'subscription', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'verified_listing_tier_c', 'judge', 'state', 199.00, 1990.00, 10,
    '{"placement": "premium", "analytics": "standard", "support": "email", "visibility": "county"}'::jsonb,
    'verified_listing', 'subscription', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'verified_listing_tier_d', 'judge', 'state', 119.00, 1190.00, 10,
    '{"placement": "premium", "analytics": "standard", "support": "email", "visibility": "local"}'::jsonb,
    'verified_listing', 'subscription', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (tier_name) DO UPDATE SET
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  annual_discount_months = EXCLUDED.annual_discount_months,
  tier_group = EXCLUDED.tier_group,
  purchase_type = EXCLUDED.purchase_type,
  is_active = true,
  features = EXCLUDED.features,
  updated_at = CURRENT_TIMESTAMP;

COMMIT;
