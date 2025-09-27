BEGIN;

CREATE TABLE IF NOT EXISTS ad_waitlist (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type text NOT NULL CHECK (entity_type in ('judge','court')),
  entity_id uuid NOT NULL,
  email text NOT NULL,
  firm_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ad_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (we may throttle at API) and admin reads
CREATE POLICY ad_waitlist_public_insert ON ad_waitlist FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY ad_waitlist_admin_read ON ad_waitlist FOR SELECT USING (false);

COMMIT;
