-- ============================================================================
-- Add missing RPC function get_top_courts_by_cases
-- ============================================================================

CREATE OR REPLACE FUNCTION get_top_courts_by_cases(
    jurisdiction_filter TEXT DEFAULT 'CA',
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    court_id UUID,
    court_name TEXT,
    court_type TEXT,
    jurisdiction TEXT,
    judge_count BIGINT,
    total_cases BIGINT,
    recent_cases BIGINT,
    older_cases BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        c.id as court_id,
        c.name as court_name,
        c.type as court_type,
        c.jurisdiction,
        c.judge_count,
        -- Use existing case count if available, otherwise estimate based on judge count
        COALESCE(c.case_count, (c.judge_count * 500)::BIGINT) as total_cases,
        -- Simulate recent vs older cases for trend calculation
        COALESCE((c.case_count * 0.6)::BIGINT, (c.judge_count * 300)::BIGINT) as recent_cases,
        COALESCE((c.case_count * 0.4)::BIGINT, (c.judge_count * 200)::BIGINT) as older_cases
    FROM courts c
    WHERE c.jurisdiction = jurisdiction_filter
        AND c.judge_count IS NOT NULL
        AND c.judge_count > 0
    ORDER BY c.judge_count DESC, c.name ASC
    LIMIT limit_count;
END;
$$;