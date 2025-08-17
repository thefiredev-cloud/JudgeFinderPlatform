-- ===================================================================
-- COMPREHENSIVE DATABASE INTEGRITY CHECK QUERIES
-- JudgeFinder Platform - Judicial Transparency Database
-- ===================================================================

-- Basic Table Statistics
-- ===================================================================

SELECT 'TABLE COUNTS' as check_type;

SELECT 
    'judges' as table_name,
    COUNT(*) as record_count,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as records_with_name,
    COUNT(CASE WHEN court_id IS NOT NULL THEN 1 END) as records_with_court_id,
    COUNT(CASE WHEN jurisdiction IS NOT NULL THEN 1 END) as records_with_jurisdiction
FROM judges

UNION ALL

SELECT 
    'courts' as table_name,
    COUNT(*) as record_count,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as records_with_name,
    COUNT(CASE WHEN jurisdiction IS NOT NULL THEN 1 END) as records_with_jurisdiction,
    COUNT(CASE WHEN address IS NOT NULL THEN 1 END) as records_with_address
FROM courts

UNION ALL

SELECT 
    'cases' as table_name,
    COUNT(*) as record_count,
    COUNT(CASE WHEN case_name IS NOT NULL THEN 1 END) as records_with_name,
    COUNT(CASE WHEN judge_id IS NOT NULL THEN 1 END) as records_with_judge_id,
    COUNT(CASE WHEN court_id IS NOT NULL THEN 1 END) as records_with_court_id
FROM cases;

-- ===================================================================
-- REFERENTIAL INTEGRITY CHECKS
-- ===================================================================

SELECT 'REFERENTIAL INTEGRITY ISSUES' as check_type;

-- Judges with invalid court_id references
SELECT 
    'Judges with invalid court references' as issue_type,
    COUNT(*) as count,
    'HIGH' as severity
FROM judges j
LEFT JOIN courts c ON j.court_id = c.id
WHERE j.court_id IS NOT NULL AND c.id IS NULL

UNION ALL

-- Cases with invalid judge_id references
SELECT 
    'Cases with invalid judge references' as issue_type,
    COUNT(*) as count,
    'HIGH' as severity
FROM cases ca
LEFT JOIN judges j ON ca.judge_id = j.id
WHERE ca.judge_id IS NOT NULL AND j.id IS NULL

UNION ALL

-- Cases with invalid court_id references
SELECT 
    'Cases with invalid court references' as issue_type,
    COUNT(*) as count,
    'MEDIUM' as severity
FROM cases ca
LEFT JOIN courts c ON ca.court_id = c.id
WHERE ca.court_id IS NOT NULL AND c.id IS NULL

UNION ALL

-- Attorney slots with invalid judge references
SELECT 
    'Attorney slots with invalid judge references' as issue_type,
    COUNT(*) as count,
    'MEDIUM' as severity
FROM attorney_slots s
LEFT JOIN judges j ON s.judge_id = j.id
WHERE j.id IS NULL

UNION ALL

-- Attorney slots with invalid attorney references
SELECT 
    'Attorney slots with invalid attorney references' as issue_type,
    COUNT(*) as count,
    'MEDIUM' as severity
FROM attorney_slots s
LEFT JOIN attorneys a ON s.attorney_id = a.id
WHERE s.attorney_id IS NOT NULL AND a.id IS NULL;

-- ===================================================================
-- DATA COMPLETENESS ANALYSIS
-- ===================================================================

SELECT 'DATA COMPLETENESS ISSUES' as check_type;

SELECT 
    'Judges missing court_id' as issue_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM judges), 2) as percentage,
    'HIGH' as severity
FROM judges
WHERE court_id IS NULL

UNION ALL

SELECT 
    'Judges missing court_name' as issue_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM judges), 2) as percentage,
    'MEDIUM' as severity
FROM judges
WHERE court_name IS NULL OR TRIM(court_name) = ''

UNION ALL

SELECT 
    'Judges missing jurisdiction' as issue_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM judges), 2) as percentage,
    'MEDIUM' as severity
FROM judges
WHERE jurisdiction IS NULL OR TRIM(jurisdiction) = ''

UNION ALL

SELECT 
    'Courts missing jurisdiction' as issue_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM courts), 2) as percentage,
    'MEDIUM' as severity
FROM courts
WHERE jurisdiction IS NULL OR TRIM(jurisdiction) = ''

UNION ALL

SELECT 
    'Courts missing type' as issue_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM courts), 2) as percentage,
    'LOW' as severity
FROM courts
WHERE type IS NULL OR TRIM(type) = ''

UNION ALL

SELECT 
    'Courts missing address' as issue_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM courts), 2) as percentage,
    'LOW' as severity
FROM courts
WHERE address IS NULL OR TRIM(address) = '';

-- ===================================================================
-- CALIFORNIA JUDGES ACCESSIBILITY CHECK
-- ===================================================================

SELECT 'CALIFORNIA JUDGES ACCESSIBILITY' as check_type;

-- Check different jurisdiction formats for California
SELECT 
    jurisdiction,
    COUNT(*) as judge_count,
    CASE 
        WHEN jurisdiction IN ('CA', 'California', 'CALIFORNIA') THEN 'ACCESSIBLE'
        ELSE 'POTENTIALLY_INACCESSIBLE'
    END as accessibility_status
FROM judges
WHERE jurisdiction IS NOT NULL
GROUP BY jurisdiction
ORDER BY judge_count DESC;

-- Total California judges by different criteria
SELECT 'California Judge Count Analysis' as analysis_type;

SELECT 
    'CA jurisdiction only' as criteria,
    COUNT(*) as count
FROM judges
WHERE jurisdiction = 'CA'

UNION ALL

SELECT 
    'California jurisdiction only' as criteria,
    COUNT(*) as count
FROM judges
WHERE jurisdiction = 'California'

UNION ALL

SELECT 
    'CALIFORNIA jurisdiction only' as criteria,
    COUNT(*) as count
FROM judges
WHERE jurisdiction = 'CALIFORNIA'

UNION ALL

SELECT 
    'All CA variants combined' as criteria,
    COUNT(*) as count
FROM judges
WHERE jurisdiction IN ('CA', 'California', 'CALIFORNIA')

UNION ALL

SELECT 
    'All records with CA-like jurisdiction' as criteria,
    COUNT(*) as count
FROM judges
WHERE jurisdiction ILIKE '%california%' OR jurisdiction ILIKE '%ca%';

-- ===================================================================
-- DUPLICATE RECORDS DETECTION
-- ===================================================================

SELECT 'DUPLICATE RECORDS ANALYSIS' as check_type;

-- Judges with identical names
SELECT 
    'Judges with duplicate names' as issue_type,
    COUNT(*) as duplicate_groups,
    SUM(judge_count - 1) as excess_records
FROM (
    SELECT 
        name,
        COUNT(*) as judge_count
    FROM judges
    WHERE name IS NOT NULL AND TRIM(name) != ''
    GROUP BY name
    HAVING COUNT(*) > 1
) duplicates;

-- Courts with identical names and jurisdictions
SELECT 
    'Courts with duplicate name+jurisdiction' as issue_type,
    COUNT(*) as duplicate_groups,
    SUM(court_count - 1) as excess_records
FROM (
    SELECT 
        name,
        jurisdiction,
        COUNT(*) as court_count
    FROM courts
    WHERE name IS NOT NULL AND TRIM(name) != ''
    GROUP BY name, jurisdiction
    HAVING COUNT(*) > 1
) duplicates;

-- ===================================================================
-- COURT-JUDGE RELATIONSHIP VALIDATION
-- ===================================================================

SELECT 'COURT-JUDGE RELATIONSHIP ISSUES' as check_type;

-- Judges with mismatched court names
SELECT 
    'Judges with court name mismatches' as issue_type,
    COUNT(*) as count,
    'HIGH' as severity
FROM judges j
JOIN courts c ON j.court_id = c.id
WHERE j.court_name IS NOT NULL 
    AND c.name IS NOT NULL
    AND LOWER(TRIM(j.court_name)) != LOWER(TRIM(c.name));

-- Courts with incorrect judge counts
SELECT 
    'Courts with incorrect judge counts' as issue_type,
    COUNT(*) as count,
    'MEDIUM' as severity
FROM (
    SELECT 
        c.id,
        c.judge_count as stored_count,
        COUNT(j.id) as actual_count
    FROM courts c
    LEFT JOIN judges j ON c.id = j.court_id
    GROUP BY c.id, c.judge_count
    HAVING c.judge_count != COUNT(j.id)
) mismatches;

-- ===================================================================
-- DATA QUALITY ASSESSMENT
-- ===================================================================

SELECT 'DATA QUALITY ISSUES' as check_type;

-- Judges with questionable names
SELECT 
    'Judges with questionable names' as issue_type,
    COUNT(*) as count,
    'MEDIUM' as severity
FROM judges
WHERE name IS NOT NULL
    AND (
        LENGTH(TRIM(name)) < 3
        OR name ILIKE '%unknown%'
        OR name ILIKE '%test%'
        OR name ~ '^[^a-zA-Z\s\-\.'']+.*'
        OR name ~ '.*[0-9]{3,}.*'
    );

-- Courts with questionable names
SELECT 
    'Courts with questionable names' as issue_type,
    COUNT(*) as count,
    'MEDIUM' as severity
FROM courts
WHERE name IS NOT NULL
    AND (
        LENGTH(TRIM(name)) < 5
        OR name ILIKE '%test%'
        OR name ILIKE '%temp%'
    );

-- ===================================================================
-- GEOGRAPHIC CONSISTENCY CHECK
-- ===================================================================

SELECT 'GEOGRAPHIC CONSISTENCY ISSUES' as check_type;

-- Judges and courts with mismatched jurisdictions
SELECT 
    'Judge-court jurisdiction mismatches' as issue_type,
    COUNT(*) as count,
    'MEDIUM' as severity
FROM judges j
JOIN courts c ON j.court_id = c.id
WHERE j.jurisdiction IS NOT NULL 
    AND c.jurisdiction IS NOT NULL
    AND j.jurisdiction != c.jurisdiction;

-- ===================================================================
-- ORPHANED RECORDS DETECTION
-- ===================================================================

SELECT 'ORPHANED RECORDS' as check_type;

-- Judges without court assignments
SELECT 
    'Judges without court assignment' as issue_type,
    COUNT(*) as count,
    'HIGH' as severity
FROM judges
WHERE court_id IS NULL

UNION ALL

-- Cases without judge assignments
SELECT 
    'Cases without judge assignment' as issue_type,
    COUNT(*) as count,
    'MEDIUM' as severity
FROM cases
WHERE judge_id IS NULL

UNION ALL

-- Cases without court assignments
SELECT 
    'Cases without court assignment' as issue_type,
    COUNT(*) as count,
    'MEDIUM' as severity
FROM cases
WHERE court_id IS NULL;

-- ===================================================================
-- DETAILED FINDINGS FOR CRITICAL ISSUES
-- ===================================================================

-- Show specific judges with missing court assignments (top 10)
SELECT 'SPECIFIC ISSUES - Judges without courts' as details;

SELECT 
    id,
    name,
    jurisdiction,
    created_at
FROM judges
WHERE court_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Show specific court name mismatches (top 10)
SELECT 'SPECIFIC ISSUES - Court name mismatches' as details;

SELECT 
    j.id as judge_id,
    j.name as judge_name,
    j.court_name as stored_court_name,
    c.name as actual_court_name,
    j.jurisdiction
FROM judges j
JOIN courts c ON j.court_id = c.id
WHERE j.court_name IS NOT NULL 
    AND c.name IS NOT NULL
    AND LOWER(TRIM(j.court_name)) != LOWER(TRIM(c.name))
LIMIT 10;

-- Show jurisdiction distribution for analysis
SELECT 'JURISDICTION DISTRIBUTION' as analysis;

SELECT 
    COALESCE(jurisdiction, 'NULL') as jurisdiction,
    COUNT(*) as judge_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM judges), 2) as percentage
FROM judges
GROUP BY jurisdiction
ORDER BY judge_count DESC;

-- ===================================================================
-- PERFORMANCE INDICATORS
-- ===================================================================

SELECT 'DATABASE PERFORMANCE INDICATORS' as check_type;

-- Table sizes (approximate)
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
    AND tablename IN ('judges', 'courts', 'cases', 'attorney_slots')
    AND attname IN ('id', 'name', 'jurisdiction', 'court_id', 'judge_id')
ORDER BY tablename, attname;

-- Index usage (if available)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND tablename IN ('judges', 'courts', 'cases')
ORDER BY tablename, idx_scan DESC;

-- ===================================================================
-- RECOMMENDATIONS SUMMARY
-- ===================================================================

SELECT 'INTEGRITY CHECK COMPLETE' as status,
       'Review results above for issues and recommendations' as next_steps;