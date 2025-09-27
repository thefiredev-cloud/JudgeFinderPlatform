-- RPC and view to support sponsored search tiles appearing after organic results

BEGIN;

CREATE OR REPLACE VIEW sponsored_search_inventory AS
SELECT
  s.id,
  s.entity_type,
  s.entity_id,
  s.position,
  s.status,
  s.pricing_tier,
  s.base_price_monthly,
  a.id AS advertiser_id,
  a.firm_name,
  a.description,
  a.bar_number,
  a.verification_status,
  a.contact_email,
  a.contact_phone,
  a.website,
  cta.cta_url AS sponsored_url,
  cta.headline,
  cta.description AS creative_description,
  cta.badge_text,
  s.updated_at
FROM ad_spots s
JOIN advertiser_profiles a ON a.id = s.current_advertiser_id
LEFT JOIN LATERAL (
  SELECT
    ac.cta_url,
    ac.headline,
    ac.description,
    ac.badge_text
  FROM ad_creatives ac
  JOIN ad_bookings b ON b.campaign_id = ac.campaign_id
  WHERE b.ad_spot_id = s.id
    AND ac.is_active = true
  ORDER BY b.start_date DESC
  LIMIT 1
) cta ON TRUE
WHERE s.entity_type = 'judge'
  AND s.status = 'booked'
  AND a.verification_status = 'verified';

CREATE OR REPLACE FUNCTION search_sponsored_tiles(
  p_query TEXT,
  p_limit INTEGER DEFAULT 2
) RETURNS TABLE (
  id UUID,
  advertiser_id UUID,
  title TEXT,
  description TEXT,
  badge TEXT,
  sponsored_url TEXT,
  bar_number TEXT,
  verified BOOLEAN,
  pricing_tier TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT
) AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(p_limit, 1), 2);
BEGIN
  RETURN QUERY
  SELECT
    inventory.id,
    inventory.advertiser_id,
    inventory.firm_name,
    inventory.creative_description,
    inventory.badge_text,
    inventory.sponsored_url,
    inventory.bar_number,
    inventory.verification_status = 'verified',
    inventory.pricing_tier,
    inventory.contact_email,
    inventory.contact_phone,
    inventory.website
  FROM sponsored_search_inventory inventory
  WHERE SIMILARITY(inventory.firm_name || ' ' || COALESCE(inventory.creative_description, ''), p_query) > 0.1
  ORDER BY SIMILARITY(inventory.firm_name || ' ' || COALESCE(inventory.creative_description, ''), p_query) DESC,
           inventory.updated_at DESC
  LIMIT v_limit;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT SELECT ON sponsored_search_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION search_sponsored_tiles(TEXT, INTEGER) TO authenticated;

COMMIT;
