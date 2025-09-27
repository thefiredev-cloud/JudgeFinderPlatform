-- Optimize indexes to support edge API query patterns
-- Created: 2025-09-27

CREATE INDEX IF NOT EXISTS idx_judges_total_cases_desc
  ON public.judges (total_cases DESC);

CREATE INDEX IF NOT EXISTS idx_cases_judge_filing_date_desc
  ON public.cases (judge_id, filing_date DESC);

CREATE INDEX IF NOT EXISTS idx_cases_judge_decision_date_desc
  ON public.cases (judge_id, decision_date DESC);
