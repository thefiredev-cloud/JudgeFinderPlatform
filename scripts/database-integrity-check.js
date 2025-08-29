#!/usr/bin/env node

/**
 * Comprehensive Database Integrity Check for JudgeFinder Platform
 * 
 * This script performs extensive validation of the judicial database:
 * - Data completeness checks
 * - Referential integrity validation
 * - Data quality assessment
 * - Performance analysis
 * - Orphaned record detection
 * - Duplicate identification
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Initialize Supabase client with service role key for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

class DatabaseIntegrityChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {},
      issues: [],
      recommendations: [],
      statistics: {}
    }
  }

  async runAllChecks() {
    console.log('🔍 Starting comprehensive database integrity check...\n')
    
    try {
      // 1. Basic table counts and existence
      await this.checkBasicTableStats()
      
      // 2. Referential integrity checks
      await this.checkReferentialIntegrity()
      
      // 3. Data completeness validation
      await this.checkDataCompleteness()
      
      // 4. Data quality assessment
      await this.checkDataQuality()
      
      // 5. Orphaned records detection
      await this.findOrphanedRecords()
      
      // 6. Duplicate records identification
      await this.findDuplicateRecords()
      
      // 7. Performance and indexing analysis
      await this.analyzePerformance()
      
      // 8. Geographic data validation
      await this.validateGeographicData()
      
      // 9. Court-Judge relationship validation
      await this.validateCourtJudgeRelationships()
      
      // Generate comprehensive report
      await this.generateReport()
      
    } catch (error) {
      console.error('❌ Error during integrity check:', error)
      this.results.issues.push({
        severity: 'CRITICAL',
        category: 'SYSTEM_ERROR',
        description: `Integrity check failed: ${error.message}`,
        details: error.stack
      })
    }
  }

  async checkBasicTableStats() {
    console.log('📊 Checking basic table statistics...')
    
    const tables = ['judges', 'courts', 'cases', 'users', 'attorneys', 'attorney_slots']
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          this.results.issues.push({
            severity: 'HIGH',
            category: 'TABLE_ACCESS',
            description: `Cannot access table: ${table}`,
            details: error.message
          })
        } else {
          this.results.statistics[`${table}_count`] = count
          console.log(`  ✓ ${table}: ${count} records`)
        }
      } catch (err) {
        this.results.issues.push({
          severity: 'HIGH',
          category: 'TABLE_ACCESS',
          description: `Error accessing table: ${table}`,
          details: err.message
        })
      }
    }
  }

  async checkReferentialIntegrity() {
    console.log('\n🔗 Checking referential integrity...')
    
    // Check judges with invalid court_id references
    const { data: invalidJudgeCourts, error: err1 } = await supabase.rpc('check_invalid_judge_courts', {})
    
    if (!err1 && invalidJudgeCourts) {
      if (invalidJudgeCourts.length > 0) {
        this.results.issues.push({
          severity: 'HIGH',
          category: 'REFERENTIAL_INTEGRITY',
          description: `${invalidJudgeCourts.length} judges have invalid court_id references`,
          details: invalidJudgeCourts.slice(0, 10) // Show first 10
        })
      } else {
        console.log('  ✓ All judges have valid court references')
      }
    }

    // Check cases with invalid judge_id references
    const { data: invalidCaseJudges, error: err2 } = await supabase.rpc('check_invalid_case_judges', {})
    
    if (!err2 && invalidCaseJudges) {
      if (invalidCaseJudges.length > 0) {
        this.results.issues.push({
          severity: 'HIGH',
          category: 'REFERENTIAL_INTEGRITY',
          description: `${invalidCaseJudges.length} cases have invalid judge_id references`,
          details: invalidCaseJudges.slice(0, 10)
        })
      } else {
        console.log('  ✓ All cases have valid judge references')
      }
    }

    // Check attorney_slots with invalid references
    const { data: invalidSlots, error: err3 } = await supabase.rpc('check_invalid_attorney_slots', {})
    
    if (!err3 && invalidSlots) {
      if (invalidSlots.length > 0) {
        this.results.issues.push({
          severity: 'MEDIUM',
          category: 'REFERENTIAL_INTEGRITY',
          description: `${invalidSlots.length} attorney slots have invalid references`,
          details: invalidSlots.slice(0, 10)
        })
      } else {
        console.log('  ✓ All attorney slots have valid references')
      }
    }
  }

  async checkDataCompleteness() {
    console.log('\n📋 Checking data completeness...')
    
    // Check judges with missing critical information
    const { data: judgesData, error: judgesError } = await supabase
      .from('judges')
      .select('id, name, court_id, court_name, jurisdiction')
    
    if (!judgesError && judgesData) {
      const missingCourtId = judgesData.filter(j => !j.court_id).length
      const missingCourtName = judgesData.filter(j => !j.court_name).length
      const missingJurisdiction = judgesData.filter(j => !j.jurisdiction).length
      
      console.log(`  • Judges missing court_id: ${missingCourtId}`)
      console.log(`  • Judges missing court_name: ${missingCourtName}`)
      console.log(`  • Judges missing jurisdiction: ${missingJurisdiction}`)
      
      if (missingCourtId > 0) {
        this.results.issues.push({
          severity: 'HIGH',
          category: 'DATA_COMPLETENESS',
          description: `${missingCourtId} judges are missing court_id`,
          count: missingCourtId
        })
      }
      
      if (missingCourtName > 0) {
        this.results.issues.push({
          severity: 'MEDIUM',
          category: 'DATA_COMPLETENESS',
          description: `${missingCourtName} judges are missing court_name`,
          count: missingCourtName
        })
      }
      
      if (missingJurisdiction > 0) {
        this.results.issues.push({
          severity: 'MEDIUM',
          category: 'DATA_COMPLETENESS',
          description: `${missingJurisdiction} judges are missing jurisdiction`,
          count: missingJurisdiction
        })
      }
    }

    // Check courts with missing information
    const { data: courtsData, error: courtsError } = await supabase
      .from('courts')
      .select('id, name, jurisdiction, type, address')
    
    if (!courtsError && courtsData) {
      const missingJurisdiction = courtsData.filter(c => !c.jurisdiction).length
      const missingType = courtsData.filter(c => !c.type).length
      const missingAddress = courtsData.filter(c => !c.address).length
      
      console.log(`  • Courts missing jurisdiction: ${missingJurisdiction}`)
      console.log(`  • Courts missing type: ${missingType}`)
      console.log(`  • Courts missing address: ${missingAddress}`)
      
      if (missingJurisdiction > 0) {
        this.results.issues.push({
          severity: 'MEDIUM',
          category: 'DATA_COMPLETENESS',
          description: `${missingJurisdiction} courts are missing jurisdiction`,
          count: missingJurisdiction
        })
      }
    }
  }

  async checkDataQuality() {
    console.log('\n🎯 Checking data quality...')
    
    // Check for judges with invalid names (too short, special characters)
    const { data: judgesData } = await supabase
      .from('judges')
      .select('id, name')
    
    if (judgesData) {
      const invalidNames = judgesData.filter(j => 
        !j.name || 
        j.name.length < 3 || 
        j.name.includes('Unknown') ||
        /^[^a-zA-Z\s\-\.']+/.test(j.name)
      )
      
      if (invalidNames.length > 0) {
        this.results.issues.push({
          severity: 'MEDIUM',
          category: 'DATA_QUALITY',
          description: `${invalidNames.length} judges have questionable names`,
          details: invalidNames.slice(0, 5).map(j => ({ id: j.id, name: j.name }))
        })
      }
      
      console.log(`  • Judges with questionable names: ${invalidNames.length}`)
    }

    // Check for duplicate judge names (potential data issues)
    const { data: duplicateNames } = await supabase.rpc('find_duplicate_judge_names', {})
    
    if (duplicateNames && duplicateNames.length > 0) {
      this.results.issues.push({
        severity: 'MEDIUM',
        category: 'DATA_QUALITY',
        description: `${duplicateNames.length} judge names appear multiple times`,
        details: duplicateNames.slice(0, 10)
      })
      console.log(`  • Duplicate judge names: ${duplicateNames.length}`)
    }

    // Check jurisdiction consistency
    const { data: jurisdictionIssues } = await supabase.rpc('check_jurisdiction_consistency', {})
    
    if (jurisdictionIssues && jurisdictionIssues.length > 0) {
      this.results.issues.push({
        severity: 'MEDIUM',
        category: 'DATA_QUALITY',
        description: `${jurisdictionIssues.length} records have jurisdiction inconsistencies`,
        details: jurisdictionIssues.slice(0, 10)
      })
      console.log(`  • Jurisdiction inconsistencies: ${jurisdictionIssues.length}`)
    }
  }

  async findOrphanedRecords() {
    console.log('\n🔍 Finding orphaned records...')
    
    // Find judges without courts
    const { data: orphanedJudges, error: err1 } = await supabase
      .from('judges')
      .select('id, name, court_id')
      .is('court_id', null)
    
    if (!err1 && orphanedJudges && orphanedJudges.length > 0) {
      this.results.issues.push({
        severity: 'HIGH',
        category: 'ORPHANED_RECORDS',
        description: `${orphanedJudges.length} judges are not assigned to any court`,
        count: orphanedJudges.length,
        details: orphanedJudges.slice(0, 10)
      })
      console.log(`  • Orphaned judges (no court): ${orphanedJudges.length}`)
    }

    // Find cases without judges
    const { data: orphanedCases, error: err2 } = await supabase
      .from('cases')
      .select('id, case_number, judge_id')
      .is('judge_id', null)
    
    if (!err2 && orphanedCases && orphanedCases.length > 0) {
      this.results.issues.push({
        severity: 'MEDIUM',
        category: 'ORPHANED_RECORDS',
        description: `${orphanedCases.length} cases are not assigned to any judge`,
        count: orphanedCases.length
      })
      console.log(`  • Orphaned cases (no judge): ${orphanedCases.length}`)
    }

    // Find attorney slots without attorneys
    const { data: orphanedSlots, error: err3 } = await supabase
      .from('attorney_slots')
      .select('id, judge_id, attorney_id')
      .is('attorney_id', null)
    
    if (!err3 && orphanedSlots) {
      console.log(`  • Empty attorney slots: ${orphanedSlots.length}`)
      this.results.statistics.empty_attorney_slots = orphanedSlots.length
    }
  }

  async findDuplicateRecords() {
    console.log('\n🔄 Finding duplicate records...')
    
    // Find potential duplicate judges (same name, different IDs)
    const { data: duplicateJudges } = await supabase.rpc('find_potential_duplicate_judges', {})
    
    if (duplicateJudges && duplicateJudges.length > 0) {
      this.results.issues.push({
        severity: 'MEDIUM',
        category: 'DUPLICATE_RECORDS',
        description: `${duplicateJudges.length} potential duplicate judge records found`,
        details: duplicateJudges.slice(0, 10)
      })
      console.log(`  • Potential duplicate judges: ${duplicateJudges.length}`)
    }

    // Find duplicate courts (same name and jurisdiction)
    const { data: duplicateCourts } = await supabase.rpc('find_duplicate_courts', {})
    
    if (duplicateCourts && duplicateCourts.length > 0) {
      this.results.issues.push({
        severity: 'MEDIUM',
        category: 'DUPLICATE_RECORDS',
        description: `${duplicateCourts.length} potential duplicate court records found`,
        details: duplicateCourts.slice(0, 10)
      })
      console.log(`  • Potential duplicate courts: ${duplicateCourts.length}`)
    }
  }

  async analyzePerformance() {
    console.log('\n⚡ Analyzing database performance...')
    
    // Check table sizes
    const { data: tableSizes } = await supabase.rpc('get_table_sizes', {})
    
    if (tableSizes) {
      this.results.statistics.table_sizes = tableSizes
      console.log('  • Table sizes retrieved')
    }

    // Check for missing indexes on frequently queried columns
    const { data: indexAnalysis } = await supabase.rpc('analyze_index_usage', {})
    
    if (indexAnalysis) {
      const missingIndexes = indexAnalysis.filter(idx => idx.usage_score < 0.5)
      
      if (missingIndexes.length > 0) {
        this.results.recommendations.push({
          category: 'PERFORMANCE',
          priority: 'MEDIUM',
          description: 'Consider adding indexes for better query performance',
          details: missingIndexes
        })
      }
      console.log(`  • Index analysis completed`)
    }
  }

  async validateGeographicData() {
    console.log('\n🗺️  Validating geographic data consistency...')
    
    // Check for consistent California jurisdiction data
    const { data: jurisdictionStats } = await supabase
      .from('judges')
      .select('jurisdiction')
      .not('jurisdiction', 'is', null)
    
    if (jurisdictionStats) {
      const jurisdictionCounts = {}
      jurisdictionStats.forEach(j => {
        const jur = j.jurisdiction
        jurisdictionCounts[jur] = (jurisdictionCounts[jur] || 0) + 1
      })
      
      this.results.statistics.jurisdiction_distribution = jurisdictionCounts
      console.log('  • Jurisdiction distribution:')
      Object.entries(jurisdictionCounts).forEach(([jur, count]) => {
        console.log(`    - ${jur}: ${count} judges`)
      })
      
      // Check for California vs CA inconsistency
      const caVariants = Object.keys(jurisdictionCounts).filter(j => 
        j.toLowerCase().includes('california') || j.toLowerCase() === 'ca'
      )
      
      if (caVariants.length > 1) {
        this.results.issues.push({
          severity: 'MEDIUM',
          category: 'DATA_CONSISTENCY',
          description: 'Multiple California jurisdiction formats detected',
          details: caVariants.map(variant => ({
            jurisdiction: variant,
            count: jurisdictionCounts[variant]
          }))
        })
      }
    }
  }

  async validateCourtJudgeRelationships() {
    console.log('\n⚖️  Validating court-judge relationships...')
    
    // Check judges whose court_name doesn't match their court_id's actual name
    const { data: mismatchedCourts } = await supabase.rpc('find_court_name_mismatches', {})
    
    if (mismatchedCourts && mismatchedCourts.length > 0) {
      this.results.issues.push({
        severity: 'HIGH',
        category: 'DATA_CONSISTENCY',
        description: `${mismatchedCourts.length} judges have mismatched court names`,
        details: mismatchedCourts.slice(0, 10)
      })
      console.log(`  • Court name mismatches: ${mismatchedCourts.length}`)
    }

    // Check court judge counts vs actual judge assignments
    const { data: courtCountIssues } = await supabase.rpc('validate_court_judge_counts', {})
    
    if (courtCountIssues && courtCountIssues.length > 0) {
      this.results.issues.push({
        severity: 'MEDIUM',
        category: 'DATA_CONSISTENCY',
        description: `${courtCountIssues.length} courts have incorrect judge counts`,
        details: courtCountIssues.slice(0, 10)
      })
      console.log(`  • Incorrect court judge counts: ${courtCountIssues.length}`)
    }

    // Validate that all California judges are accessible
    const { count: totalJudges } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
    
    const { count: californiaJudgesCount } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .eq('jurisdiction', 'CA')
    
    this.results.statistics.california_judges_accessible = californiaJudgesCount
    console.log(`  • California judges accessible: ${californiaJudgesCount}`)
    
    if (californiaJudgesCount !== totalJudges) {
      this.results.issues.push({
        severity: 'HIGH',
        category: 'DATA_ACCESSIBILITY',
        description: `Expected ${totalJudges} California judges, found ${californiaJudgesCount}`,
        expected: totalJudges,
        actual: californiaJudgesCount
      })
    } else {
      console.log(`  ✓ All ${totalJudges} judges properly configured with CA jurisdiction`)
    }
  }

  async generateReport() {
    console.log('\n📄 Generating comprehensive report...')
    
    // Calculate summary statistics
    const totalIssues = this.results.issues.length
    const criticalIssues = this.results.issues.filter(i => i.severity === 'CRITICAL').length
    const highIssues = this.results.issues.filter(i => i.severity === 'HIGH').length
    const mediumIssues = this.results.issues.filter(i => i.severity === 'MEDIUM').length
    
    this.results.summary = {
      total_issues: totalIssues,
      critical_issues: criticalIssues,
      high_priority_issues: highIssues,
      medium_priority_issues: mediumIssues,
      recommendations_count: this.results.recommendations.length,
      database_health_score: this.calculateHealthScore()
    }

    // Generate recommendations based on findings
    this.generateRecommendations()
    
    // Save report to file
    const reportPath = path.join(__dirname, '..', 'database-integrity-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2))
    
    // Display summary
    this.displaySummary()
    
    console.log(`\n📁 Full report saved to: ${reportPath}`)
  }

  calculateHealthScore() {
    const totalChecks = 20 // Approximate number of checks performed
    const issueWeight = {
      'CRITICAL': 10,
      'HIGH': 5,
      'MEDIUM': 2,
      'LOW': 1
    }
    
    let deductions = 0
    this.results.issues.forEach(issue => {
      deductions += issueWeight[issue.severity] || 1
    })
    
    const baseScore = 100
    const score = Math.max(0, baseScore - deductions)
    
    return Math.round(score)
  }

  generateRecommendations() {
    // Generate specific recommendations based on issues found
    if (this.results.issues.some(i => i.category === 'REFERENTIAL_INTEGRITY')) {
      this.results.recommendations.push({
        category: 'DATA_INTEGRITY',
        priority: 'HIGH',
        description: 'Fix referential integrity issues to prevent 404 errors',
        action: 'Update foreign key references or remove orphaned records'
      })
    }
    
    if (this.results.issues.some(i => i.category === 'DATA_ACCESSIBILITY')) {
      this.results.recommendations.push({
        category: 'DATA_ACCESS',
        priority: 'CRITICAL',
        description: 'Ensure all California judges are properly accessible',
        action: 'Standardize jurisdiction field values and update API filters'
      })
    }
    
    if (this.results.issues.some(i => i.category === 'DATA_COMPLETENESS')) {
      this.results.recommendations.push({
        category: 'DATA_QUALITY',
        priority: 'MEDIUM',
        description: 'Complete missing data fields for better user experience',
        action: 'Populate missing court assignments and geographic information'
      })
    }
  }

  displaySummary() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 DATABASE INTEGRITY CHECK SUMMARY')
    console.log('='.repeat(60))
    console.log(`🏥 Overall Health Score: ${this.results.summary.database_health_score}/100`)
    console.log(`📊 Total Issues Found: ${this.results.summary.total_issues}`)
    console.log(`🚨 Critical Issues: ${this.results.summary.critical_issues}`)
    console.log(`⚠️  High Priority: ${this.results.summary.high_priority_issues}`)
    console.log(`📝 Medium Priority: ${this.results.summary.medium_priority_issues}`)
    console.log(`💡 Recommendations: ${this.results.summary.recommendations_count}`)
    
    console.log('\n📈 KEY STATISTICS:')
    Object.entries(this.results.statistics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        console.log(`  • ${key.replace(/_/g, ' ')}: ${value}`)
      }
    })
    
    if (this.results.summary.critical_issues > 0 || this.results.summary.high_priority_issues > 0) {
      console.log('\n🚨 URGENT ACTIONS NEEDED:')
      this.results.issues
        .filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH')
        .forEach(issue => {
          console.log(`  • ${issue.description}`)
        })
    }
    
    console.log('\n💡 TOP RECOMMENDATIONS:')
    this.results.recommendations.slice(0, 3).forEach(rec => {
      console.log(`  • [${rec.priority}] ${rec.description}`)
    })
    
    console.log('\n' + '='.repeat(60))
  }
}

// Create SQL functions for advanced checks
async function createHelperFunctions() {
  const functions = [
    // Check for judges with invalid court references
    `
    CREATE OR REPLACE FUNCTION check_invalid_judge_courts()
    RETURNS TABLE(judge_id uuid, judge_name text, invalid_court_id uuid) AS $$
    BEGIN
      RETURN QUERY
      SELECT j.id, j.name::text, j.court_id
      FROM judges j
      LEFT JOIN courts c ON j.court_id = c.id
      WHERE j.court_id IS NOT NULL AND c.id IS NULL;
    END;
    $$ LANGUAGE plpgsql;
    `,
    
    // Check for cases with invalid judge references
    `
    CREATE OR REPLACE FUNCTION check_invalid_case_judges()
    RETURNS TABLE(case_id uuid, case_number text, invalid_judge_id uuid) AS $$
    BEGIN
      RETURN QUERY
      SELECT ca.id, ca.case_number::text, ca.judge_id
      FROM cases ca
      LEFT JOIN judges j ON ca.judge_id = j.id
      WHERE ca.judge_id IS NOT NULL AND j.id IS NULL;
    END;
    $$ LANGUAGE plpgsql;
    `,
    
    // Check for attorney slots with invalid references
    `
    CREATE OR REPLACE FUNCTION check_invalid_attorney_slots()
    RETURNS TABLE(slot_id uuid, judge_id uuid, attorney_id uuid, issue text) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        s.id, 
        s.judge_id, 
        s.attorney_id,
        CASE 
          WHEN j.id IS NULL THEN 'Invalid judge reference'
          WHEN s.attorney_id IS NOT NULL AND a.id IS NULL THEN 'Invalid attorney reference'
          ELSE 'Unknown issue'
        END::text
      FROM attorney_slots s
      LEFT JOIN judges j ON s.judge_id = j.id
      LEFT JOIN attorneys a ON s.attorney_id = a.id
      WHERE j.id IS NULL OR (s.attorney_id IS NOT NULL AND a.id IS NULL);
    END;
    $$ LANGUAGE plpgsql;
    `,
    
    // Find duplicate judge names
    `
    CREATE OR REPLACE FUNCTION find_duplicate_judge_names()
    RETURNS TABLE(judge_name text, count bigint, judge_ids uuid[]) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        j.name::text,
        COUNT(*)::bigint,
        array_agg(j.id) as judge_ids
      FROM judges j
      WHERE j.name IS NOT NULL
      GROUP BY j.name
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC;
    END;
    $$ LANGUAGE plpgsql;
    `,
    
    // Check jurisdiction consistency
    `
    CREATE OR REPLACE FUNCTION check_jurisdiction_consistency()
    RETURNS TABLE(judge_id uuid, judge_name text, judge_jurisdiction text, court_jurisdiction text) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        j.id,
        j.name::text,
        j.jurisdiction::text,
        c.jurisdiction::text
      FROM judges j
      JOIN courts c ON j.court_id = c.id
      WHERE j.jurisdiction IS NOT NULL 
        AND c.jurisdiction IS NOT NULL
        AND j.jurisdiction != c.jurisdiction;
    END;
    $$ LANGUAGE plpgsql;
    `,
    
    // Find potential duplicate judges
    `
    CREATE OR REPLACE FUNCTION find_potential_duplicate_judges()
    RETURNS TABLE(name text, ids uuid[], count bigint) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        j.name::text,
        array_agg(j.id),
        COUNT(*)::bigint
      FROM judges j
      WHERE j.name IS NOT NULL
      GROUP BY LOWER(TRIM(j.name))
      HAVING COUNT(*) > 1;
    END;
    $$ LANGUAGE plpgsql;
    `,
    
    // Find duplicate courts
    `
    CREATE OR REPLACE FUNCTION find_duplicate_courts()
    RETURNS TABLE(court_name text, jurisdiction text, ids uuid[], count bigint) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        c.name::text,
        c.jurisdiction::text,
        array_agg(c.id),
        COUNT(*)::bigint
      FROM courts c
      WHERE c.name IS NOT NULL
      GROUP BY LOWER(TRIM(c.name)), LOWER(TRIM(COALESCE(c.jurisdiction, '')))
      HAVING COUNT(*) > 1;
    END;
    $$ LANGUAGE plpgsql;
    `,
    
    // Find court name mismatches
    `
    CREATE OR REPLACE FUNCTION find_court_name_mismatches()
    RETURNS TABLE(judge_id uuid, judge_name text, stored_court_name text, actual_court_name text) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        j.id,
        j.name::text,
        j.court_name::text,
        c.name::text
      FROM judges j
      JOIN courts c ON j.court_id = c.id
      WHERE j.court_name IS NOT NULL 
        AND c.name IS NOT NULL
        AND LOWER(TRIM(j.court_name)) != LOWER(TRIM(c.name));
    END;
    $$ LANGUAGE plpgsql;
    `,
    
    // Validate court judge counts
    `
    CREATE OR REPLACE FUNCTION validate_court_judge_counts()
    RETURNS TABLE(court_id uuid, court_name text, stored_count integer, actual_count bigint) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        c.id,
        c.name::text,
        c.judge_count,
        COUNT(j.id)::bigint
      FROM courts c
      LEFT JOIN judges j ON c.id = j.court_id
      GROUP BY c.id, c.name, c.judge_count
      HAVING c.judge_count != COUNT(j.id);
    END;
    $$ LANGUAGE plpgsql;
    `
  ]
  
  console.log('🔧 Creating helper functions for integrity checks...')
  
  for (const func of functions) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: func })
      if (error) {
        console.warn(`Warning: Could not create helper function: ${error.message}`)
      }
    } catch (err) {
      console.warn(`Warning: Could not create helper function: ${err.message}`)
    }
  }
}

// Main execution
async function main() {
  try {
    // Test database connection
    const { data, error } = await supabase.from('judges').select('count', { count: 'exact', head: true })
    
    if (error) {
      throw new Error(`Cannot connect to database: ${error.message}`)
    }
    
    console.log('✅ Database connection established')
    
    // Create helper functions (ignore errors if they already exist)
    await createHelperFunctions()
    
    // Run integrity checks
    const checker = new DatabaseIntegrityChecker()
    await checker.runAllChecks()
    
  } catch (error) {
    console.error('❌ Failed to run database integrity check:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { DatabaseIntegrityChecker }