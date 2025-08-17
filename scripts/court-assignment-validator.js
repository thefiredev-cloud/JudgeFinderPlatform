#!/usr/bin/env node

/**
 * COURT ASSIGNMENT DATA VALIDATOR
 * 
 * Validates court assignment data accuracy and completeness
 * Ensures proper judge-court relationships and data consistency
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

const CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awqrfxrwnslqsnrrwuaz.supabase.co',
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
}

class CourtAssignmentValidator {
  constructor() {
    this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY)
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        total_judges: 0,
        judges_with_court_assignments: 0,
        judges_without_court_assignments: 0,
        valid_court_relationships: 0,
        invalid_court_relationships: 0,
        jurisdiction_mismatches: 0,
        orphaned_judges: 0,
        total_courts: 0,
        courts_with_judges: 0,
        courts_without_judges: 0
      },
      validation_issues: [],
      court_statistics: {},
      jurisdiction_analysis: {},
      recommendations: []
    }
  }

  async runCourtAssignmentValidation() {
    console.log('🏛️ Starting Court Assignment Data Validation')
    console.log(`⏰ Timestamp: ${this.results.timestamp}\n`)

    try {
      // Phase 1: Validate judge-court assignments
      await this.validateJudgeCourtAssignments()
      
      // Phase 2: Validate court coverage
      await this.validateCourtCoverage()
      
      // Phase 3: Analyze jurisdiction consistency
      await this.analyzeJurisdictionConsistency()
      
      // Phase 4: Generate recommendations
      await this.generateRecommendations()
      
      // Phase 5: Create detailed report
      await this.generateCourtAssignmentReport()
      
      console.log('\n✅ Court assignment validation completed!')
      
    } catch (error) {
      console.error('❌ Court assignment validation failed:', error)
    }
  }

  async validateJudgeCourtAssignments() {
    console.log('🔍 Phase 1: Validating Judge-Court Assignments')
    
    // Get all judges with court relationships
    const { data: judges, error } = await this.supabase
      .from('judges')
      .select(`
        id,
        name,
        court_id,
        court_name,
        jurisdiction,
        courts:court_id (
          id,
          name,
          jurisdiction,
          type,
          address,
          phone,
          website,
          judge_count
        )
      `)
      .order('name')
      
    if (error) throw error
    
    this.results.summary.total_judges = judges.length
    
    for (const judge of judges) {
      const validation = this.validateSingleJudgeAssignment(judge)
      
      if (validation.hasCourtAssignment) {
        this.results.summary.judges_with_court_assignments++
      } else {
        this.results.summary.judges_without_court_assignments++
      }
      
      if (validation.validRelationship) {
        this.results.summary.valid_court_relationships++
      } else {
        this.results.summary.invalid_court_relationships++
      }
      
      if (validation.jurisdictionMismatch) {
        this.results.summary.jurisdiction_mismatches++
      }
      
      if (validation.orphaned) {
        this.results.summary.orphaned_judges++
      }
      
      // Record validation issues
      if (validation.issues.length > 0) {
        this.results.validation_issues.push({
          judge_id: judge.id,
          judge_name: judge.name,
          court_id: judge.court_id,
          court_name: judge.court_name,
          jurisdiction: judge.jurisdiction,
          issues: validation.issues,
          severity: validation.severity
        })
      }
    }
    
    console.log(`✅ Validated ${judges.length} judge assignments`)
    console.log(`   With assignments: ${this.results.summary.judges_with_court_assignments}`)
    console.log(`   Without assignments: ${this.results.summary.judges_without_court_assignments}`)
    console.log(`   Valid relationships: ${this.results.summary.valid_court_relationships}`)
    console.log(`   Invalid relationships: ${this.results.summary.invalid_court_relationships}`)
  }

  validateSingleJudgeAssignment(judge) {
    const validation = {
      hasCourtAssignment: false,
      validRelationship: false,
      jurisdictionMismatch: false,
      orphaned: false,
      issues: [],
      severity: 'LOW'
    }
    
    // Check if judge has court assignment
    if (judge.court_id || judge.court_name) {
      validation.hasCourtAssignment = true
      
      // Validate court_id assignment
      if (!judge.court_id) {
        validation.issues.push('Has court_name but missing court_id')
        validation.severity = 'MEDIUM'
      }
      
      if (!judge.court_name) {
        validation.issues.push('Has court_id but missing court_name')
        validation.severity = 'MEDIUM'
      }
      
      // Validate court relationship data
      if (judge.courts) {
        const court = judge.courts
        validation.validRelationship = true
        
        // Check name consistency
        if (court.name && judge.court_name && court.name !== judge.court_name) {
          validation.issues.push(`Court name mismatch: Judge(${judge.court_name}) vs Court(${court.name})`)
          validation.severity = 'HIGH'
        }
        
        // Check jurisdiction consistency
        if (court.jurisdiction && judge.jurisdiction && court.jurisdiction !== judge.jurisdiction) {
          validation.jurisdictionMismatch = true
          validation.issues.push(`Jurisdiction mismatch: Judge(${judge.jurisdiction}) vs Court(${court.jurisdiction})`)
          validation.severity = 'HIGH'
        }
        
        // Validate court data completeness
        if (!court.name) {
          validation.issues.push('Linked court missing name')
          validation.severity = 'MEDIUM'
        }
        
        if (!court.jurisdiction) {
          validation.issues.push('Linked court missing jurisdiction')
          validation.severity = 'MEDIUM'
        }
        
        if (!court.type) {
          validation.issues.push('Linked court missing type')
          validation.severity = 'LOW'
        }
        
        if (!court.address) {
          validation.issues.push('Linked court missing address')
          validation.severity = 'LOW'
        }
        
      } else if (judge.court_id) {
        validation.orphaned = true
        validation.issues.push('Court_id specified but court relationship data not found')
        validation.severity = 'HIGH'
      }
      
    } else {
      validation.issues.push('No court assignment found')
      validation.severity = 'MEDIUM'
    }
    
    return validation
  }

  async validateCourtCoverage() {
    console.log('\n🔍 Phase 2: Validating Court Coverage')
    
    // Get all courts with judge counts
    const { data: courts, error } = await this.supabase
      .from('courts')
      .select(`
        id,
        name,
        jurisdiction,
        type,
        judge_count,
        address,
        phone,
        website
      `)
      .order('name')
      
    if (error) throw error
    
    this.results.summary.total_courts = courts.length
    
    // Get actual judge counts per court
    const { data: actualCounts, error: countError } = await this.supabase
      .from('judges')
      .select('court_id')
      .not('court_id', 'is', null)
      
    if (countError) throw countError
    
    const judgeCountsByCourt = {}
    actualCounts.forEach(judge => {
      judgeCountsByCourt[judge.court_id] = (judgeCountsByCourt[judge.court_id] || 0) + 1
    })
    
    // Validate each court
    for (const court of courts) {
      const actualJudgeCount = judgeCountsByCourt[court.id] || 0
      const recordedJudgeCount = court.judge_count || 0
      
      if (actualJudgeCount > 0) {
        this.results.summary.courts_with_judges++
      } else {
        this.results.summary.courts_without_judges++
      }
      
      // Check for judge count discrepancies
      if (actualJudgeCount !== recordedJudgeCount) {
        this.results.validation_issues.push({
          court_id: court.id,
          court_name: court.name,
          jurisdiction: court.jurisdiction,
          issues: [`Judge count mismatch: Recorded(${recordedJudgeCount}) vs Actual(${actualJudgeCount})`],
          severity: 'MEDIUM'
        })
      }
      
      // Validate court data completeness
      const courtIssues = []
      if (!court.name) courtIssues.push('Missing court name')
      if (!court.jurisdiction) courtIssues.push('Missing jurisdiction')
      if (!court.type) courtIssues.push('Missing court type')
      if (!court.address) courtIssues.push('Missing address')
      
      if (courtIssues.length > 0) {
        this.results.validation_issues.push({
          court_id: court.id,
          court_name: court.name || 'Unknown',
          jurisdiction: court.jurisdiction,
          issues: courtIssues,
          severity: 'LOW'
        })
      }
    }
    
    console.log(`✅ Validated ${courts.length} courts`)
    console.log(`   With judges: ${this.results.summary.courts_with_judges}`)
    console.log(`   Without judges: ${this.results.summary.courts_without_judges}`)
  }

  async analyzeJurisdictionConsistency() {
    console.log('\n🔍 Phase 3: Analyzing Jurisdiction Consistency')
    
    // Get jurisdiction distribution for judges
    const { data: judgeJurisdictions, error: judgeError } = await this.supabase
      .from('judges')
      .select('jurisdiction')
      
    if (judgeError) throw judgeError
    
    // Get jurisdiction distribution for courts
    const { data: courtJurisdictions, error: courtError } = await this.supabase
      .from('courts')
      .select('jurisdiction')
      
    if (courtError) throw courtError
    
    // Analyze judge jurisdictions
    const judgeJurisdictionCounts = {}
    judgeJurisdictions.forEach(judge => {
      const jurisdiction = judge.jurisdiction || 'NULL'
      judgeJurisdictionCounts[jurisdiction] = (judgeJurisdictionCounts[jurisdiction] || 0) + 1
    })
    
    // Analyze court jurisdictions
    const courtJurisdictionCounts = {}
    courtJurisdictions.forEach(court => {
      const jurisdiction = court.jurisdiction || 'NULL'
      courtJurisdictionCounts[jurisdiction] = (courtJurisdictionCounts[jurisdiction] || 0) + 1
    })
    
    this.results.jurisdiction_analysis = {
      judge_jurisdictions: judgeJurisdictionCounts,
      court_jurisdictions: courtJurisdictionCounts,
      total_judge_jurisdictions: Object.keys(judgeJurisdictionCounts).length,
      total_court_jurisdictions: Object.keys(courtJurisdictionCounts).length
    }
    
    // Check for jurisdiction inconsistencies
    const allJurisdictions = new Set([
      ...Object.keys(judgeJurisdictionCounts),
      ...Object.keys(courtJurisdictionCounts)
    ])
    
    for (const jurisdiction of allJurisdictions) {
      const judgeCount = judgeJurisdictionCounts[jurisdiction] || 0
      const courtCount = courtJurisdictionCounts[jurisdiction] || 0
      
      if (judgeCount > 0 && courtCount === 0) {
        this.results.validation_issues.push({
          jurisdiction: jurisdiction,
          issues: [`${judgeCount} judges in jurisdiction but no courts found`],
          severity: 'HIGH'
        })
      }
      
      if (courtCount > 0 && judgeCount === 0) {
        this.results.validation_issues.push({
          jurisdiction: jurisdiction,
          issues: [`${courtCount} courts in jurisdiction but no judges found`],
          severity: 'MEDIUM'
        })
      }
    }
    
    console.log(`✅ Analyzed ${allJurisdictions.size} jurisdictions`)
    console.log(`   Judge jurisdictions: ${Object.keys(judgeJurisdictionCounts).length}`)
    console.log(`   Court jurisdictions: ${Object.keys(courtJurisdictionCounts).length}`)
  }

  async generateRecommendations() {
    console.log('\n🔍 Phase 4: Generating Recommendations')
    
    const recommendations = []
    
    // Orphaned judges recommendation
    if (this.results.summary.orphaned_judges > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'ORPHANED_JUDGES',
        message: `${this.results.summary.orphaned_judges} judges have court_id but no court relationship`,
        action: 'Check court IDs and ensure court records exist in the courts table'
      })
    }
    
    // Missing court assignments recommendation
    if (this.results.summary.judges_without_court_assignments > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'MISSING_ASSIGNMENTS',
        message: `${this.results.summary.judges_without_court_assignments} judges have no court assignment`,
        action: 'Research and assign proper courts to unassigned judges'
      })
    }
    
    // Jurisdiction mismatches recommendation
    if (this.results.summary.jurisdiction_mismatches > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'JURISDICTION_MISMATCH',
        message: `${this.results.summary.jurisdiction_mismatches} judges have jurisdiction mismatches with their courts`,
        action: 'Review and correct jurisdiction assignments for consistency'
      })
    }
    
    // Courts without judges recommendation
    if (this.results.summary.courts_without_judges > 0) {
      recommendations.push({
        priority: 'LOW',
        category: 'EMPTY_COURTS',
        message: `${this.results.summary.courts_without_judges} courts have no assigned judges`,
        action: 'Review if these courts should have judges or should be archived'
      })
    }
    
    // Data completeness recommendations
    const incompleteDataIssues = this.results.validation_issues.filter(issue => 
      issue.issues.some(i => i.includes('missing'))
    ).length
    
    if (incompleteDataIssues > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'DATA_COMPLETENESS',
        message: `${incompleteDataIssues} records have incomplete data`,
        action: 'Review and complete missing court and judge information'
      })
    }
    
    this.results.recommendations = recommendations
    
    console.log(`✅ Generated ${recommendations.length} recommendations`)
  }

  async generateCourtAssignmentReport() {
    console.log('\n📊 Phase 5: Generating Court Assignment Report')
    
    // Calculate success rates
    const assignmentRate = ((this.results.summary.judges_with_court_assignments / this.results.summary.total_judges) * 100).toFixed(2)
    const validRelationshipRate = ((this.results.summary.valid_court_relationships / this.results.summary.judges_with_court_assignments) * 100).toFixed(2)
    
    // Create comprehensive report
    const report = {
      summary: {
        ...this.results.summary,
        assignment_rate: `${assignmentRate}%`,
        valid_relationship_rate: `${validRelationshipRate}%`
      },
      jurisdiction_analysis: this.results.jurisdiction_analysis,
      recommendations: this.results.recommendations,
      validation_metadata: {
        timestamp: this.results.timestamp,
        total_issues_found: this.results.validation_issues.length,
        high_severity_issues: this.results.validation_issues.filter(i => i.severity === 'HIGH').length,
        medium_severity_issues: this.results.validation_issues.filter(i => i.severity === 'MEDIUM').length,
        low_severity_issues: this.results.validation_issues.filter(i => i.severity === 'LOW').length
      }
    }
    
    // Save detailed report
    const reportPath = path.join(process.cwd(), 'validation-reports', `court-assignment-validation-${Date.now()}.json`)
    await fs.mkdir(path.dirname(reportPath), { recursive: true })
    await fs.writeFile(reportPath, JSON.stringify({
      report,
      detailed_issues: this.results.validation_issues,
      jurisdiction_analysis: this.results.jurisdiction_analysis
    }, null, 2))
    
    console.log(`✅ Report saved: ${reportPath}`)
    
    // Print summary
    this.printCourtAssignmentSummary(report)
    
    return report
  }

  printCourtAssignmentSummary(report) {
    console.log('\n' + '='.repeat(70))
    console.log('🏛️ COURT ASSIGNMENT VALIDATION SUMMARY')
    console.log('='.repeat(70))
    console.log(`👥 Total Judges: ${report.summary.total_judges}`)
    console.log(`🏛️  Judges with Court Assignments: ${report.summary.judges_with_court_assignments} (${report.summary.assignment_rate})`)
    console.log(`✅ Valid Court Relationships: ${report.summary.valid_court_relationships} (${report.summary.valid_relationship_rate})`)
    console.log(`⚠️  Jurisdiction Mismatches: ${report.summary.jurisdiction_mismatches}`)
    console.log(`🔴 Orphaned Judges: ${report.summary.orphaned_judges}`)
    console.log(`🏛️  Total Courts: ${report.summary.total_courts}`)
    console.log(`👥 Courts with Judges: ${report.summary.courts_with_judges}`)
    console.log(`📊 Issues Found: ${report.validation_metadata.total_issues_found}`)
    
    if (report.validation_metadata.high_severity_issues > 0) {
      console.log(`🚨 High Severity Issues: ${report.validation_metadata.high_severity_issues}`)
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Top Recommendations:')
      report.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`   ${i + 1}. [${rec.priority}] ${rec.message}`)
      })
    }
    
    console.log('='.repeat(70))
  }
}

// Main execution
async function main() {
  const validator = new CourtAssignmentValidator()
  await validator.runCourtAssignmentValidation()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { CourtAssignmentValidator }