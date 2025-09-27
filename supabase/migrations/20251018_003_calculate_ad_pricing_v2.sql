-- Enhanced pricing calculation function to support exclusive rotations and bundle discounts

BEGIN;

CREATE OR REPLACE FUNCTION calculate_ad_pricing(
  p_tier_name VARCHAR,
  p_months INTEGER,
  p_is_exclusive BOOLEAN DEFAULT FALSE,
  p_bundle_size INTEGER DEFAULT 1
) RETURNS TABLE (
  total_price DECIMAL,
  monthly_rate DECIMAL,
  savings DECIMAL,
  applied_discounts JSONB
) AS $$
DECLARE
  v_tier pricing_tiers%ROWTYPE;
  v_base_monthly DECIMAL := 0;
  v_multiplier DECIMAL := 1;
  v_bundle_discount DECIMAL := 0;
  v_months INTEGER := GREATEST(1, p_months);
  v_is_annual BOOLEAN := v_months >= 12;
  v_exclusive_multiplier CONSTANT DECIMAL := 1.75;
BEGIN
  SELECT * INTO v_tier
  FROM pricing_tiers
  WHERE tier_name = p_tier_name
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pricing tier not found or inactive: %', p_tier_name;
  END IF;

  v_base_monthly := v_tier.monthly_price;

  IF p_is_exclusive THEN
    v_multiplier := v_exclusive_multiplier;
  END IF;

  IF p_bundle_size >= 10 THEN
    v_bundle_discount := 0.15;
  ELSIF p_bundle_size >= 5 THEN
    v_bundle_discount := 0.10;
  END IF;

  IF v_is_annual THEN
    total_price := (v_tier.annual_price * v_multiplier) * (1 - v_bundle_discount);
    monthly_rate := total_price / 12;
    savings := (v_base_monthly * v_multiplier * 12) - total_price;
  ELSE
    monthly_rate := (v_base_monthly * v_multiplier) * (1 - v_bundle_discount);
    total_price := monthly_rate * v_months;
    savings := (v_base_monthly * v_multiplier * v_months) - total_price;
  END IF;

  applied_discounts := jsonb_build_object(
    'exclusive_multiplier', CASE WHEN p_is_exclusive THEN v_exclusive_multiplier ELSE NULL END,
    'bundle_discount', v_bundle_discount,
    'annual', v_is_annual
  );

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMIT;
