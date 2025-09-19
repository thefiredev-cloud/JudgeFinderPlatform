-- Create table to capture public data corrections and trust feedback
CREATE TABLE IF NOT EXISTS public.profile_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_slug TEXT NOT NULL,
  court_id TEXT,
  issue_type TEXT NOT NULL,
  details TEXT NOT NULL,
  reporter_email TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'researching', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.profile_issues IS 'Inbound corrections and trust issues reported by the public.';
COMMENT ON COLUMN public.profile_issues.issue_type IS 'Category of the reported issue (e.g. data, bias, assignment).';

CREATE INDEX IF NOT EXISTS idx_profile_issues_judge_slug ON public.profile_issues (judge_slug);
CREATE INDEX IF NOT EXISTS idx_profile_issues_status ON public.profile_issues (status);

ALTER TABLE public.profile_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_issues_service_role" ON public.profile_issues;
CREATE POLICY "profile_issues_service_role" ON public.profile_issues
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
