-- ==============================================
-- Clerk to Supabase user mapping table
-- Stores admin flag and last seen timestamps
-- ==============================================

CREATE TABLE IF NOT EXISTS app_users (
    clerk_user_id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_idx
    ON app_users (LOWER(email));

CREATE TRIGGER update_app_users_updated_at
    BEFORE UPDATE ON app_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Keep RLS disabled; access is handled via service role helpers
