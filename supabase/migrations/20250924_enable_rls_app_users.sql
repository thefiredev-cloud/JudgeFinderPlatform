-- Enable strict RLS on app_users and deny all by default
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Service role still bypasses RLS, but add explicit policies for clarity and future changes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'app_users'
      AND policyname = 'Service role manages app users'
  ) THEN
    EXECUTE 'CREATE POLICY "Service role manages app users"
      ON app_users
      FOR ALL
      USING (auth.role() = ''service_role'')
      WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;

-- Allow authenticated users to read their own mapping if needed for personalization.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'app_users'
      AND policyname = 'Users can view their own app_user record'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own app_user record"
      ON app_users
      FOR SELECT
      USING (auth.uid()::text = clerk_user_id)';
  END IF;
END $$;



