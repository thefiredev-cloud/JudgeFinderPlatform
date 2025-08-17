#!/usr/bin/env node

/**
 * DATA INTEGRITY VALIDATION SYSTEM
 * 
 * Comprehensive validation of data integrity across the judicial platform
 * Checks for consistency, completeness, and quality of all judicial data
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

const CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awqrfxrwnslqsnrrwuaz.supabase.co',
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
}

class DataIntegrityValidator {
  constructor() {
    this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY)
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        total_records_validated: 0,
        integrity_score: 0,
        critical_issues: 0,
        data_quality_issues: 0,
        consistency_issues: 0,
        completeness_issues: 0
      },
      detailed_results: {
        judges_validation: {},
        courts_validation: {},
        relationships_validation: {},
        data_quality_analysis: {},
        consistency_checks: {}
      },
      critical_issues: [],
      recommendations: []
    }
  }

  async runDataIntegrityValidation() {
    console.log('🔍 Starting Comprehensive Data Integrity Validation')
    console.log(`⏰ Timestamp: ${this.results.timestamp}\n`)

    try {
      // Phase 1: Validate judges table integrity
      await this.validateJudgesTableIntegrity()
      
      // Phase 2: Validate courts table integrity
      await this.validateCourtsTableIntegrity()
      
      // Phase 3: Validate relationships integrity
      await this.validateRelationshipsIntegrity()
      
      // Phase 4: Data quality analysis
      await this.performDataQualityAnalysis()
      
      // Phase 5: Consistency checks
      await this.performConsistencyChecks()
      
      // Phase 6: Calculate integrity score
      await this.calculateIntegrityScore()
      
      // Phase 7: Generate recommendations
      await this.generateIntegrityRecommendations()
      
      // Phase 8: Create comprehensive report
      await this.generateIntegrityReport()
      
      console.log('\n✅ Data integrity validation completed!')
      
    } catch (error) {
      console.error('❌ Data integrity validation failed:', error)
    }
  }

  async validateJudgesTableIntegrity() {
    console.log('🔍 Phase 1: Validating Judges Table Integrity')
    
    // Get all judges
    const { data: judges, error } = await this.supabase
      .from('judges')
      .select('*')
      
    if (error) throw error
    
    const validation = {
      total_records: judges.length,
      valid_records: 0,
      invalid_records: 0,
      field_completeness: {},
      data_quality_issues: [],
      duplicate_checks: {},
      format_validation: {}
    }
    
    // Track field completeness
    const fields = ['name', 'jurisdiction', 'court_name', 'appointed_date', 'education', 'bio']
    fields.forEach(field => {
      validation.field_completeness[field] = {
        filled: 0,
        empty: 0,
        percentage: 0
      }
    })
    
    // Validate each judge record
    const nameMap = new Map()
    const emailSet = new Set()
    
    for (const judge of judges) {
      let isValid = true
      const issues = []
      
      // Required field validation
      if (!judge.name || judge.name.trim() === '') {
        issues.push('Missing name')
        isValid = false
      } else {
        // Check for duplicate names
        if (nameMap.has(judge.name.toLowerCase())) {
          issues.push(`Duplicate name: ${judge.name}`)
          validation.duplicate_checks.duplicate_names = (validation.duplicate_checks.duplicate_names || 0) + 1
        }
        nameMap.set(judge.name.toLowerCase(), judge.id)
      }
      
      if (!judge.jurisdiction || judge.jurisdiction.trim() === '') {
        issues.push('Missing jurisdiction')
        isValid = false
      }
      
      // Data format validation
      if (judge.reversal_rate && (judge.reversal_rate < 0 || judge.reversal_rate > 1)) {
        issues.push(`Invalid reversal rate: ${judge.reversal_rate}`)
        isValid = false
      }
      
      if (judge.total_cases && judge.total_cases < 0) {
        issues.push(`Invalid total cases: ${judge.total_cases}`)
        isValid = false
      }
      
      if (judge.average_decision_time && judge.average_decision_time < 0) {
        issues.push(`Invalid average decision time: ${judge.average_decision_time}`)
        isValid = false
      }
      
      // Date validation
      if (judge.appointed_date) {
        const appointedDate = new Date(judge.appointed_date)
        const currentDate = new Date()
        if (appointedDate > currentDate) {
          issues.push('Appointed date is in the future')
          isValid = false
        }
        if (appointedDate < new Date('1900-01-01')) {
          issues.push('Appointed date is too old')
          isValid = false
        }
      }
      
      // Field completeness tracking
      fields.forEach(field => {
        if (judge[field] && judge[field].toString().trim() !== '') {
          validation.field_completeness[field].filled++
        } else {
          validation.field_completeness[field].empty++
        }
      })
      
      if (isValid) {
        validation.valid_records++
      } else {
        validation.invalid_records++
        validation.data_quality_issues.push({
          record_id: judge.id,
          record_name: judge.name || 'Unknown',
          issues: issues
        })
      }
    }
    
    // Calculate field completeness percentages
    fields.forEach(field => {
      const total = validation.field_completeness[field].filled + validation.field_completeness[field].empty
      validation.field_completeness[field].percentage = 
        total > 0 ? ((validation.field_completeness[field].filled / total) * 100).toFixed(2) : 0
    })
    
    this.results.detailed_results.judges_validation = validation
    this.results.summary.total_records_validated += judges.length
    
    console.log(`✅ Validated ${judges.length} judge records`)
    console.log(`   Valid: ${validation.valid_records}, Invalid: ${validation.invalid_records}`)
  }

  async validateCourtsTableIntegrity() {
    console.log('\n🔍 Phase 2: Validating Courts Table Integrity')
    
    // Get all courts
    const { data: courts, error } = await this.supabase
      .from('courts')
      .select('*')
      
    if (error) throw error
    
    const validation = {
      total_records: courts.length,
      valid_records: 0,
      invalid_records: 0,
      field_completeness: {},
      data_quality_issues: [],
      duplicate_checks: {},
      type_distribution: {}
    }
    
    // Track field completeness
    const fields = ['name', 'jurisdiction', 'type', 'address', 'phone', 'website']
    fields.forEach(field => {
      validation.field_completeness[field] = {
        filled: 0,
        empty: 0,
        percentage: 0
      }
    })
    
    // Validate each court record
    const nameMap = new Map()
    const typeDistribution = {}
    
    for (const court of courts) {
      let isValid = true
      const issues = []
      
      // Required field validation
      if (!court.name || court.name.trim() === '') {
        issues.push('Missing name')
        isValid = false
      } else {
        // Check for duplicate names
        if (nameMap.has(court.name.toLowerCase())) {
          issues.push(`Duplicate name: ${court.name}`)
          validation.duplicate_checks.duplicate_names = (validation.duplicate_checks.duplicate_names || 0) + 1
        }
        nameMap.set(court.name.toLowerCase(), court.id)
      }
      
      if (!court.jurisdiction || court.jurisdiction.trim() === '') {
        issues.push('Missing jurisdiction')
        isValid = false
      }
      
      if (!court.type || court.type.trim() === '') {
        issues.push('Missing type')
        isValid = false
      } else {
        // Track type distribution
        typeDistribution[court.type] = (typeDistribution[court.type] || 0) + 1
      }
      
      // Data format validation
      if (court.judge_count && court.judge_count < 0) {
        issues.push(`Invalid judge count: ${court.judge_count}`)
        isValid = false
      }
      
      // URL validation
      if (court.website && court.website !== '') {
        if (!this.isValidURL(court.website)) {
          issues.push(`Invalid website URL: ${court.website}`)
          isValid = false
        }
      }
      
      // Phone validation
      if (court.phone && court.phone !== '') {
        if (!this.isValidPhone(court.phone)) {
          issues.push(`Invalid phone format: ${court.phone}`)
        }
      }
      
      // Field completeness tracking
      fields.forEach(field => {
        if (court[field] && court[field].toString().trim() !== '') {
          validation.field_completeness[field].filled++
        } else {
          validation.field_completeness[field].empty++
        }
      })
      
      if (isValid) {
        validation.valid_records++
      } else {
        validation.invalid_records++
        validation.data_quality_issues.push({
          record_id: court.id,
          record_name: court.name || 'Unknown',
          issues: issues
        })
      }
    }
    
    // Calculate field completeness percentages
    fields.forEach(field => {
      const total = validation.field_completeness[field].filled + validation.field_completeness[field].empty
      validation.field_completeness[field].percentage = 
        total > 0 ? ((validation.field_completeness[field].filled / total) * 100).toFixed(2) : 0
    })
    
    validation.type_distribution = typeDistribution
    
    this.results.detailed_results.courts_validation = validation
    this.results.summary.total_records_validated += courts.length
    
    console.log(`✅ Validated ${courts.length} court records`)
    console.log(`   Valid: ${validation.valid_records}, Invalid: ${validation.invalid_records}`)
  }

  async validateRelationshipsIntegrity() {
    console.log('\n🔍 Phase 3: Validating Relationships Integrity')
    
    const validation = {
      judge_court_relationships: {},
      orphaned_records: [],
      referential_integrity: {}
    }
    
    // Check judge-court relationships
    const { data: judgeCourtData, error: jcError } = await this.supabase
      .from('judges')
      .select(`
        id,
        name,
        court_id,
        court_name,
        courts:court_id (id, name)
      `)
      
    if (jcError) throw jcError
    
    let validRelationships = 0
    let invalidRelationships = 0
    let orphanedJudges = 0
    
    for (const judge of judgeCourtData) {
      if (judge.court_id) {
        if (judge.courts) {
          validRelationships++
        } else {
          invalidRelationships++
          orphanedJudges++
          validation.orphaned_records.push({
            type: 'judge',
            id: judge.id,
            name: judge.name,
            issue: 'References non-existent court',
            court_id: judge.court_id
          })
        }
      }
    }
    
    // Check for courts without judges
    const { data: allCourts, error: courtsError } = await this.supabase
      .from('courts')
      .select('id, name')
      
    if (courtsError) throw courtsError
    
    const { data: judgesByCourt, error: jbcError } = await this.supabase
      .from('judges')
      .select('court_id')
      .not('court_id', 'is', null)
      
    if (jbcError) throw jbcError
    
    const courtsWithJudges = new Set(judgesByCourt.map(j => j.court_id))
    const orphanedCourts = allCourts.filter(court => !courtsWithJudges.has(court.id))
    
    validation.judge_court_relationships = {
      valid_relationships: validRelationships,
      invalid_relationships: invalidRelationships,
      orphaned_judges: orphanedJudges,
      orphaned_courts: orphanedCourts.length
    }
    
    this.results.detailed_results.relationships_validation = validation
    
    console.log(`✅ Validated relationships`)
    console.log(`   Valid judge-court relationships: ${validRelationships}`)
    console.log(`   Invalid relationships: ${invalidRelationships}`)
    console.log(`   Orphaned judges: ${orphanedJudges}`)
    console.log(`   Orphaned courts: ${orphanedCourts.length}`)
  }

  async performDataQualityAnalysis() {
    console.log('\n🔍 Phase 4: Data Quality Analysis')
    
    const analysis = {
      name_quality: {},
      date_quality: {},
      numeric_quality: {},
      text_quality: {}
    }
    
    // Analyze judge name quality
    const { data: judges, error } = await this.supabase
      .from('judges')
      .select('name, appointed_date, total_cases, reversal_rate, bio, education')
      
    if (error) throw error
    
    let namesWithNumbers = 0
    let namesWithSpecialChars = 0
    let shortNames = 0
    let longNames = 0
    let invalidDates = 0
    let futureDates = 0
    let negativeNumbers = 0
    let extremeValues = 0
    
    for (const judge of judges) {
      // Name quality checks
      if (judge.name) {
        if (/\d/.test(judge.name)) namesWithNumbers++
        if (/[^a-zA-Z\s\-\.'']/.test(judge.name)) namesWithSpecialChars++
        if (judge.name.length < 3) shortNames++
        if (judge.name.length > 100) longNames++
      }
      
      // Date quality checks
      if (judge.appointed_date) {
        const date = new Date(judge.appointed_date)
        if (isNaN(date.getTime())) {
          invalidDates++
        } else if (date > new Date()) {
          futureDates++
        }
      }
      
      // Numeric quality checks
      if (judge.total_cases < 0) negativeNumbers++
      if (judge.reversal_rate < 0 || judge.reversal_rate > 1) extremeValues++
      if (judge.total_cases > 10000) extremeValues++ // Extreme case count
    }
    
    analysis.name_quality = {
      names_with_numbers: namesWithNumbers,
      names_with_special_chars: namesWithSpecialChars,
      short_names: shortNames,
      long_names: longNames
    }
    
    analysis.date_quality = {
      invalid_dates: invalidDates,
      future_dates: futureDates
    }
    
    analysis.numeric_quality = {
      negative_numbers: negativeNumbers,
      extreme_values: extremeValues
    }
    
    this.results.detailed_results.data_quality_analysis = analysis
    
    console.log(`✅ Data quality analysis completed`)
    console.log(`   Names with issues: ${namesWithNumbers + namesWithSpecialChars + shortNames + longNames}`)
    console.log(`   Date issues: ${invalidDates + futureDates}`)
    console.log(`   Numeric issues: ${negativeNumbers + extremeValues}`)
  }

  async performConsistencyChecks() {
    console.log('\n🔍 Phase 5: Consistency Checks')
    
    const checks = {
      jurisdiction_consistency: {},
      naming_consistency: {},
      data_synchronization: {}
    }
    
    // Check jurisdiction consistency between judges and courts
    const { data: jurisdictionData, error } = await this.supabase
      .from('judges')
      .select(`
        jurisdiction,
        court_name,
        courts:court_id (jurisdiction, name)
      `)
      .not('court_id', 'is', null)
      
    if (error) throw error
    
    let jurisdictionMatches = 0
    let jurisdictionMismatches = 0
    let nameMatches = 0
    let nameMismatches = 0
    
    for (const judge of jurisdictionData) {
      if (judge.courts) {
        // Check jurisdiction consistency
        if (judge.jurisdiction === judge.courts.jurisdiction) {
          jurisdictionMatches++
        } else {
          jurisdictionMismatches++
        }
        
        // Check court name consistency
        if (judge.court_name === judge.courts.name) {
          nameMatches++
        } else {
          nameMismatches++
        }
      }
    }
    
    checks.jurisdiction_consistency = {
      matches: jurisdictionMatches,
      mismatches: jurisdictionMismatches
    }
    
    checks.naming_consistency = {
      matches: nameMatches,
      mismatches: nameMismatches
    }
    
    this.results.detailed_results.consistency_checks = checks
    
    console.log(`✅ Consistency checks completed`)
    console.log(`   Jurisdiction consistency: ${jurisdictionMatches} matches, ${jurisdictionMismatches} mismatches`)
    console.log(`   Name consistency: ${nameMatches} matches, ${nameMismatches} mismatches`)
  }

  async calculateIntegrityScore() {
    console.log('\n🔍 Phase 6: Calculating Data Integrity Score')
    
    const judgesValidation = this.results.detailed_results.judges_validation
    const courtsValidation = this.results.detailed_results.courts_validation
    const relationshipsValidation = this.results.detailed_results.relationships_validation
    const qualityAnalysis = this.results.detailed_results.data_quality_analysis
    const consistencyChecks = this.results.detailed_results.consistency_checks
    
    // Calculate component scores (0-100)
    const completenessScore = this.calculateCompletenessScore(judgesValidation, courtsValidation)
    const validityScore = this.calculateValidityScore(judgesValidation, courtsValidation)
    const consistencyScore = this.calculateConsistencyScore(consistencyChecks)
    const integrityScore = this.calculateRelationshipIntegrityScore(relationshipsValidation)
    
    // Overall integrity score (weighted average)
    const overallScore = (
      completenessScore * 0.3 +
      validityScore * 0.3 +
      consistencyScore * 0.2 +
      integrityScore * 0.2
    ).toFixed(2)
    
    this.results.summary.integrity_score = parseFloat(overallScore)
    this.results.summary.critical_issues = this.countCriticalIssues()
    this.results.summary.data_quality_issues = this.countDataQualityIssues()
    this.results.summary.consistency_issues = consistencyChecks.jurisdiction_consistency.mismatches + 
                                              consistencyChecks.naming_consistency.mismatches
    this.results.summary.completeness_issues = this.countCompletenessIssues(judgesValidation, courtsValidation)
    
    console.log(`✅ Data integrity score calculated: ${overallScore}/100`)
    console.log(`   Completeness: ${completenessScore}/100`)
    console.log(`   Validity: ${validityScore}/100`)
    console.log(`   Consistency: ${consistencyScore}/100`)
    console.log(`   Relationship Integrity: ${integrityScore}/100`)
  }

  calculateCompletenessScore(judgesValidation, courtsValidation) {
    const judgeFields = Object.values(judgesValidation.field_completeness)
    const courtFields = Object.values(courtsValidation.field_completeness)
    
    const avgJudgeCompleteness = judgeFields.reduce((sum, field) => sum + parseFloat(field.percentage), 0) / judgeFields.length
    const avgCourtCompleteness = courtFields.reduce((sum, field) => sum + parseFloat(field.percentage), 0) / courtFields.length
    
    return ((avgJudgeCompleteness + avgCourtCompleteness) / 2).toFixed(2)
  }

  calculateValidityScore(judgesValidation, courtsValidation) {
    const totalRecords = judgesValidation.total_records + courtsValidation.total_records
    const validRecords = judgesValidation.valid_records + courtsValidation.valid_records
    
    return ((validRecords / totalRecords) * 100).toFixed(2)
  }

  calculateConsistencyScore(consistencyChecks) {
    const totalJurisdictionChecks = consistencyChecks.jurisdiction_consistency.matches + consistencyChecks.jurisdiction_consistency.mismatches
    const totalNameChecks = consistencyChecks.naming_consistency.matches + consistencyChecks.naming_consistency.mismatches
    
    if (totalJurisdictionChecks === 0 && totalNameChecks === 0) return 100
    
    const jurisdictionScore = totalJurisdictionChecks > 0 ? 
      (consistencyChecks.jurisdiction_consistency.matches / totalJurisdictionChecks) * 100 : 100
    
    const nameScore = totalNameChecks > 0 ? 
      (consistencyChecks.naming_consistency.matches / totalNameChecks) * 100 : 100
    
    return ((jurisdictionScore + nameScore) / 2).toFixed(2)
  }

  calculateRelationshipIntegrityScore(relationshipsValidation) {
    const totalRelationships = relationshipsValidation.judge_court_relationships.valid_relationships + 
                               relationshipsValidation.judge_court_relationships.invalid_relationships
    
    if (totalRelationships === 0) return 100
    
    return ((relationshipsValidation.judge_court_relationships.valid_relationships / totalRelationships) * 100).toFixed(2)
  }

  countCriticalIssues() {
    const judgesIssues = this.results.detailed_results.judges_validation.data_quality_issues.length
    const courtsIssues = this.results.detailed_results.courts_validation.data_quality_issues.length
    const orphanedRecords = this.results.detailed_results.relationships_validation.orphaned_records.length
    
    return judgesIssues + courtsIssues + orphanedRecords
  }

  countDataQualityIssues() {
    const qualityAnalysis = this.results.detailed_results.data_quality_analysis
    
    return Object.values(qualityAnalysis.name_quality).reduce((sum, val) => sum + val, 0) +
           Object.values(qualityAnalysis.date_quality).reduce((sum, val) => sum + val, 0) +
           Object.values(qualityAnalysis.numeric_quality).reduce((sum, val) => sum + val, 0)
  }

  countCompletenessIssues(judgesValidation, courtsValidation) {
    return judgesValidation.invalid_records + courtsValidation.invalid_records
  }

  async generateIntegrityRecommendations() {
    console.log('\n🔍 Phase 7: Generating Integrity Recommendations')
    
    const recommendations = []
    
    // Critical issues recommendations
    if (this.results.summary.critical_issues > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'CRITICAL_ISSUES',
        message: `${this.results.summary.critical_issues} critical data integrity issues found`,
        action: 'Immediately review and fix invalid records and orphaned relationships'
      })
    }
    
    // Data quality recommendations
    if (this.results.summary.data_quality_issues > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'DATA_QUALITY',
        message: `${this.results.summary.data_quality_issues} data quality issues detected`,
        action: 'Review and standardize data formats, validate names and dates'
      })
    }
    
    // Consistency recommendations
    if (this.results.summary.consistency_issues > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'CONSISTENCY',
        message: `${this.results.summary.consistency_issues} consistency issues found`,
        action: 'Synchronize jurisdiction and court name data between related records'
      })
    }
    
    // Completeness recommendations
    if (this.results.summary.completeness_issues > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'COMPLETENESS',
        message: `${this.results.summary.completeness_issues} records have incomplete data`,
        action: 'Fill in missing required fields and improve data collection processes'
      })
    }
    
    // Integrity score recommendations
    if (this.results.summary.integrity_score < 80) {
      recommendations.push({
        priority: 'HIGH',
        category: 'OVERALL_INTEGRITY',
        message: `Data integrity score is below threshold (${this.results.summary.integrity_score}/100)`,
        action: 'Implement comprehensive data governance and quality assurance processes'
      })
    }
    
    this.results.recommendations = recommendations
    
    console.log(`✅ Generated ${recommendations.length} integrity recommendations`)
  }

  async generateIntegrityReport() {
    console.log('\n📊 Phase 8: Generating Data Integrity Report')
    
    // Create comprehensive report
    const report = {
      summary: this.results.summary,
      detailed_validation: this.results.detailed_results,
      recommendations: this.results.recommendations,
      validation_metadata: {
        timestamp: this.results.timestamp,
        validation_scope: 'Complete database integrity validation',
        tables_validated: ['judges', 'courts'],
        relationships_validated: ['judge-court assignments'],
        quality_dimensions: ['completeness', 'validity', 'consistency', 'integrity']
      }
    }
    
    // Save detailed report
    const reportPath = path.join(process.cwd(), 'validation-reports', `data-integrity-validation-${Date.now()}.json`)
    await fs.mkdir(path.dirname(reportPath), { recursive: true })
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`✅ Report saved: ${reportPath}`)
    
    // Print summary
    this.printIntegritySummary(report)
    
    return report
  }

  printIntegritySummary(report) {
    console.log('\n' + '='.repeat(70))
    console.log('🔍 DATA INTEGRITY VALIDATION SUMMARY')
    console.log('='.repeat(70))
    console.log(`📊 Total Records Validated: ${report.summary.total_records_validated}`)
    console.log(`🎯 Overall Integrity Score: ${report.summary.integrity_score}/100`)
    console.log(`🚨 Critical Issues: ${report.summary.critical_issues}`)
    console.log(`⚠️  Data Quality Issues: ${report.summary.data_quality_issues}`)
    console.log(`🔄 Consistency Issues: ${report.summary.consistency_issues}`)
    console.log(`📝 Completeness Issues: ${report.summary.completeness_issues}`)
    
    // Score interpretation
    const score = report.summary.integrity_score
    let interpretation = ''
    if (score >= 95) interpretation = '🟢 EXCELLENT'
    else if (score >= 85) interpretation = '🟡 GOOD'
    else if (score >= 70) interpretation = '🟠 NEEDS IMPROVEMENT'
    else interpretation = '🔴 CRITICAL'
    
    console.log(`📈 Integrity Assessment: ${interpretation}`)
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Priority Recommendations:')
      report.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`   ${i + 1}. [${rec.priority}] ${rec.message}`)
      })
    }
    
    console.log('='.repeat(70))
  }

  // Utility functions
  isValidURL(string) {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  isValidPhone(phone) {
    // Basic phone validation - adjust regex as needed
    return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''))
  }
}

// Main execution
async function main() {
  const validator = new DataIntegrityValidator()
  await validator.runDataIntegrityValidation()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { DataIntegrityValidator }