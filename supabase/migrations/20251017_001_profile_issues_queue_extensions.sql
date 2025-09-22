-- Enhance profile issues queue with SLA handling and prioritization
ALTER TABLE public.profile_issues
  ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('high', 'medium', 'low')),
  ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS breached_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_status_change_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS response_notes TEXT,
  ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_profile_issues_priority ON public.profile_issues (priority DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_issues_sla_due ON public.profile_issues (sla_due_at);

COMMENT ON COLUMN public.profile_issues.priority IS 'Higher priority numbers triage first in the corrections queue.';
COMMENT ON COLUMN public.profile_issues.severity IS 'Operational severity band informing SLA expectations.';
COMMENT ON COLUMN public.profile_issues.sla_due_at IS 'Target resolution timestamp derived from severity and policy.';
COMMENT ON COLUMN public.profile_issues.breached_at IS 'When an SLA breach was first recorded.';
COMMENT ON COLUMN public.profile_issues.acknowledged_at IS 'When the issue was triaged by an administrator.';
COMMENT ON COLUMN public.profile_issues.resolved_at IS 'When the issue was marked resolved.';
COMMENT ON COLUMN public.profile_issues.last_status_change_at IS 'Latest status transition timestamp.';
COMMENT ON COLUMN public.profile_issues.response_notes IS 'Internal remediation notes or outbound communication references.';
COMMENT ON COLUMN public.profile_issues.meta IS 'Structured metadata for workflow automation (source URLs, attachments, etc.).';
