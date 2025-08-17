-- Performance Optimization Indexes for JudgeFinder Platform
-- This script creates indexes to improve query performance for common search patterns

-- Judges table performance indexes
-- Index for name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_judges_name_text_ops ON judges USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_judges_name_lower ON judges(lower(name));

-- Index for jurisdiction filtering
CREATE INDEX IF NOT EXISTS idx_judges_jurisdiction ON judges(jurisdiction) WHERE jurisdiction IS NOT NULL;

-- Combined index for common queries (name + jurisdiction)
CREATE INDEX IF NOT EXISTS idx_judges_name_jurisdiction ON judges(name, jurisdiction);

-- Index for slug lookups (used in judge profile pages)
CREATE INDEX IF NOT EXISTS idx_judges_slug ON judges(slug) WHERE slug IS NOT NULL;

-- Courts table performance indexes
-- Index for court name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_courts_name_text_ops ON courts USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_courts_name_lower ON courts(lower(name));

-- Index for jurisdiction filtering
CREATE INDEX IF NOT EXISTS idx_courts_jurisdiction ON courts(jurisdiction) WHERE jurisdiction IS NOT NULL;

-- Index for court type filtering
CREATE INDEX IF NOT EXISTS idx_courts_type ON courts(type) WHERE type IS NOT NULL;

-- Combined index for common queries
CREATE INDEX IF NOT EXISTS idx_courts_name_jurisdiction_type ON courts(name, jurisdiction, type);

-- Cases table performance indexes (for decision summaries)
-- Index for judge-based queries
CREATE INDEX IF NOT EXISTS idx_cases_judge_id ON cases(judge_id) WHERE judge_id IS NOT NULL;

-- Index for decision date queries (used in recent decisions)
CREATE INDEX IF NOT EXISTS idx_cases_decision_date ON cases(decision_date) WHERE decision_date IS NOT NULL;

-- Combined index for decision summary queries (judge + date)
CREATE INDEX IF NOT EXISTS idx_cases_judge_date ON cases(judge_id, decision_date) 
WHERE judge_id IS NOT NULL AND decision_date IS NOT NULL;

-- Partial index for recent decisions (last 5 years)
CREATE INDEX IF NOT EXISTS idx_cases_recent_decisions ON cases(judge_id, decision_date) 
WHERE decision_date >= CURRENT_DATE - INTERVAL '5 years' 
AND judge_id IS NOT NULL;

-- Update table statistics for better query planning
ANALYZE judges;
ANALYZE courts;
ANALYZE cases;

-- Vacuum to reclaim space and update statistics
VACUUM ANALYZE judges;
VACUUM ANALYZE courts;
VACUUM ANALYZE cases;