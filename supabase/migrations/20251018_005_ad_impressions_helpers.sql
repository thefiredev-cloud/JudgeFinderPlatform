BEGIN;

CREATE OR REPLACE FUNCTION increment_int(x integer)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(x, 0) + 1
$$;

CREATE TABLE IF NOT EXISTS ad_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_spot_id uuid NOT NULL REFERENCES ad_spots(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type in ('impression','click')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  meta jsonb
);

CREATE INDEX IF NOT EXISTS idx_ad_events_spot_time ON ad_events(ad_spot_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION log_ad_event(p_slot_id uuid, p_event text, p_meta jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO ad_events (ad_spot_id, event_type, meta) VALUES (p_slot_id, p_event, p_meta);
END;
$$;

GRANT SELECT, INSERT ON ad_events TO authenticated;
GRANT EXECUTE ON FUNCTION log_ad_event(uuid, text, jsonb) TO authenticated;

COMMIT;
