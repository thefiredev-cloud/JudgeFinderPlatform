-- Enable RLS and add public SELECT policy on ad_spots (idempotent)
ALTER TABLE ad_spots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ad_spots' AND policyname = 'Ad spots are viewable by everyone'
  ) THEN
    EXECUTE 'CREATE POLICY "Ad spots are viewable by everyone" ON ad_spots FOR SELECT USING (true)';
  END IF;
END $$;

-- Seed ad_spots: 3 per judge, 3 per court (idempotent)
-- Judges
INSERT INTO ad_spots (entity_type, entity_id, position, base_price_monthly, court_level)
SELECT 'judge' AS entity_type, j.id AS entity_id, p.position,
  CASE WHEN j.total_cases > 1000 THEN 1500.00
       WHEN j.total_cases > 500 THEN 1000.00
       ELSE 500.00 END AS base_price_monthly,
  j.court_level
FROM judges j
CROSS JOIN (SELECT 1 AS position UNION ALL SELECT 2 UNION ALL SELECT 3) p
ON CONFLICT (entity_type, entity_id, position) DO NOTHING;

-- Courts
INSERT INTO ad_spots (entity_type, entity_id, position, base_price_monthly)
SELECT 'court' AS entity_type, c.id AS entity_id, p.position,
  CASE WHEN c.judge_count > 50 THEN 2000.00
       WHEN c.judge_count > 20 THEN 1500.00
       ELSE 750.00 END AS base_price_monthly
FROM courts c
CROSS JOIN (SELECT 1 AS position UNION ALL SELECT 2 UNION ALL SELECT 3) p
ON CONFLICT (entity_type, entity_id, position) DO NOTHING;


