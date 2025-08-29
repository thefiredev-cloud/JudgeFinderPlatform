#!/usr/bin/env node

/**
 * JUDGE DATA CLEANING AND VALIDATION SCRIPT
 * 
 * This script identifies and removes test data, validates all judge profiles,
 * and ensures data accuracy across the platform.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

class JudgeDataCleaner {
  constructor() {
    this.testDataPatterns = [
      /^test/i,
      /^demo/i,
      /^example/i,
      /^sample/i,
      /^fake/i,
      /^dummy/i,
      /^temp/i,
      /^delete/i,
      /^remove/i,
      /\btest\b/i,
      /\bdemo\b/i,
      /^judge\s+\d+$/i,  // Generic names like "Judge 1", "Judge 2"
      /^placeholder/i,
      /^xxx/i,
      /^aaa/i,
      /^zzz/i
    ]
    
    this.suspiciousJudges = []
    this.invalidJudges = []
    this.cleanedCount = 0
  }

  async run() {
    console.log('🧹 Starting Judge Data Cleaning Process')
    console.log('=' .repeat(60))
    
    try {
      // Phase 1: Identify test and suspicious data
      await this.identifyTestData()
      
      // Phase 2: Validate all judge profiles
      await this.validateJudgeProfiles()
      
      // Phase 3: Check for data anomalies
      await this.checkDataAnomalies()
      
      // Phase 4: Clean identified test data
      if (this.suspiciousJudges.length > 0 || this.invalidJudges.length > 0) {
        await this.cleanTestData()
      }
      
      // Phase 5: Generate report
      await this.generateReport()
      
      console.log('\n✅ Data cleaning completed successfully!')
      
    } catch (error) {
      console.error('❌ Error during data cleaning:', error)
      process.exit(1)
    }
  }

  /**
   * Identify test and suspicious judge entries
   */
  async identifyTestData() {
    console.log('\n📋 Phase 1: Identifying Test Data')
    console.log('-'.repeat(40))
    
    // Get all judges
    const { data: judges, error } = await supabase
      .from('judges')
      .select('*')
      .order('name')
    
    if (error) {
      throw new Error(`Failed to fetch judges: ${error.message}`)
    }
    
    console.log(`Found ${judges.length} total judges`)
    
    // Check each judge for test patterns
    for (const judge of judges) {
      let isTestData = false
      let reasons = []
      
      // Check name patterns
      for (const pattern of this.testDataPatterns) {
        if (pattern.test(judge.name)) {
          isTestData = true
          reasons.push(`Name matches test pattern: ${pattern}`)
          break
        }
      }
      
      // Check for missing critical data
      if (!judge.court_name || judge.court_name.trim() === '') {
        reasons.push('Missing court name')
      }
      
      if (!judge.jurisdiction || judge.jurisdiction.trim() === '') {
        reasons.push('Missing jurisdiction')
      }
      
      // Check for unrealistic data
      if (judge.total_cases === 0) {
        reasons.push('Zero total cases')
      }
      
      if (judge.reversal_rate && (judge.reversal_rate < 0 || judge.reversal_rate > 1)) {
        reasons.push(`Invalid reversal rate: ${judge.reversal_rate}`)
      }
      
      // Check for test email patterns
      if (judge.email && (
        judge.email.includes('test') ||
        judge.email.includes('example') ||
        judge.email.includes('@test.') ||
        judge.email.includes('@example.')
      )) {
        isTestData = true
        reasons.push(`Test email address: ${judge.email}`)
      }
      
      // Check for placeholder bio
      if (judge.bio && (
        judge.bio === 'TBD' ||
        judge.bio === 'TODO' ||
        judge.bio === 'Lorem ipsum' ||
        judge.bio.toLowerCase().includes('placeholder') ||
        judge.bio.toLowerCase().includes('test bio')
      )) {
        reasons.push('Placeholder or test bio content')
      }
      
      // Check for invalid appointed dates
      if (judge.appointed_date) {
        const appointedYear = new Date(judge.appointed_date).getFullYear()
        const currentYear = new Date().getFullYear()
        
        if (appointedYear < 1900 || appointedYear > currentYear) {
          reasons.push(`Invalid appointed date: ${judge.appointed_date}`)
        }
      }
      
      // Add to appropriate list
      if (isTestData) {
        this.suspiciousJudges.push({
          id: judge.id,
          name: judge.name,
          court_name: judge.court_name,
          reasons: reasons,
          type: 'TEST_DATA'
        })
      } else if (reasons.length > 0) {
        this.invalidJudges.push({
          id: judge.id,
          name: judge.name,
          court_name: judge.court_name,
          reasons: reasons,
          type: 'INVALID_DATA'
        })
      }
    }
    
    console.log(`✅ Found ${this.suspiciousJudges.length} test data entries`)
    console.log(`⚠️  Found ${this.invalidJudges.length} judges with invalid data`)
    
    // Display suspicious entries
    if (this.suspiciousJudges.length > 0) {
      console.log('\n🚨 Test Data Entries Found:')
      this.suspiciousJudges.slice(0, 10).forEach(judge => {
        console.log(`   - ${judge.name} (${judge.court_name || 'No Court'})`)
        judge.reasons.forEach(reason => {
          console.log(`     • ${reason}`)
        })
      })
      if (this.suspiciousJudges.length > 10) {
        console.log(`   ... and ${this.suspiciousJudges.length - 10} more`)
      }
    }
  }

  /**
   * Validate all judge profiles for completeness
   */
  async validateJudgeProfiles() {
    console.log('\n📋 Phase 2: Validating Judge Profiles')
    console.log('-'.repeat(40))
    
    const { data: judges, error } = await supabase
      .from('judges')
      .select('id, name, jurisdiction')
      .eq('jurisdiction', 'CA')
    
    if (error) {
      console.error('Error fetching CA judges:', error)
      return
    }
    
    console.log(`Validating ${judges.length} California judges`)
    
    // Check for duplicate names
    const nameMap = new Map()
    const duplicates = []
    
    judges.forEach(judge => {
      if (nameMap.has(judge.name)) {
        duplicates.push({
          name: judge.name,
          ids: [nameMap.get(judge.name), judge.id]
        })
      } else {
        nameMap.set(judge.name, judge.id)
      }
    })
    
    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate judge names`)
      duplicates.slice(0, 5).forEach(dup => {
        console.log(`   - ${dup.name} (IDs: ${dup.ids.join(', ')})`)
      })
    } else {
      console.log('✅ No duplicate judge names found')
    }
  }

  /**
   * Check for data anomalies
   */
  async checkDataAnomalies() {
    console.log('\n📋 Phase 3: Checking Data Anomalies')
    console.log('-'.repeat(40))
    
    // Check judges with no cases
    const { data: judgesNoCases, error: noCasesError } = await supabase
      .from('judges')
      .select('id, name, total_cases')
      .eq('jurisdiction', 'CA')
      .or('total_cases.eq.0,total_cases.is.null')
      .limit(100)
    
    if (!noCasesError && judgesNoCases) {
      console.log(`⚠️  ${judgesNoCases.length} judges have no cases`)
      if (judgesNoCases.length > 0 && judgesNoCases.length <= 10) {
        judgesNoCases.forEach(judge => {
          console.log(`   - ${judge.name}`)
        })
      }
    }
    
    // Check judges with unrealistic case counts
    const { data: judgesHighCases, error: highCasesError } = await supabase
      .from('judges')
      .select('id, name, total_cases')
      .eq('jurisdiction', 'CA')
      .gt('total_cases', 10000)
      .limit(10)
    
    if (!highCasesError && judgesHighCases && judgesHighCases.length > 0) {
      console.log(`⚠️  ${judgesHighCases.length} judges have unusually high case counts (>10,000)`)
      judgesHighCases.forEach(judge => {
        console.log(`   - ${judge.name}: ${judge.total_cases} cases`)
      })
    }
  }

  /**
   * Clean identified test data
   */
  async cleanTestData() {
    console.log('\n📋 Phase 4: Cleaning Test Data')
    console.log('-'.repeat(40))
    
    if (this.suspiciousJudges.length === 0) {
      console.log('✅ No test data to clean')
      return
    }
    
    console.log(`🗑️  Preparing to remove ${this.suspiciousJudges.length} test entries`)
    
    // Create backup first
    const backupData = {
      timestamp: new Date().toISOString(),
      removed_judges: this.suspiciousJudges,
      total_removed: this.suspiciousJudges.length
    }
    
    const fs = require('fs').promises
    const backupPath = `./backups/removed-judges-${Date.now()}.json`
    await fs.mkdir('./backups', { recursive: true })
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2))
    console.log(`📁 Backup saved to: ${backupPath}`)
    
    // Remove test data
    for (const judge of this.suspiciousJudges) {
      try {
        // First, remove related data
        
        // Remove analytics cache
        await supabase
          .from('judge_analytics_cache')
          .delete()
          .eq('judge_id', judge.id)
        
        // Remove cases
        await supabase
          .from('cases')
          .delete()
          .eq('judge_id', judge.id)
        
        // Remove judge profile
        const { error } = await supabase
          .from('judges')
          .delete()
          .eq('id', judge.id)
        
        if (error) {
          console.error(`   ❌ Failed to remove ${judge.name}: ${error.message}`)
        } else {
          console.log(`   ✅ Removed: ${judge.name}`)
          this.cleanedCount++
        }
        
      } catch (error) {
        console.error(`   ❌ Error removing ${judge.name}:`, error.message)
      }
    }
    
    console.log(`✅ Cleaned ${this.cleanedCount} test entries`)
  }

  /**
   * Generate cleaning report
   */
  async generateReport() {
    console.log('\n📋 Phase 5: Generating Report')
    console.log('-'.repeat(40))
    
    // Get final counts
    const { count: totalJudges } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .eq('jurisdiction', 'CA')
    
    const { count: totalCases } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
    
    const { count: analyticsCount } = await supabase
      .from('judge_analytics_cache')
      .select('*', { count: 'exact', head: true })
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_judges_after_cleaning: totalJudges || 0,
        total_cases: totalCases || 0,
        analytics_cached: analyticsCount || 0,
        test_data_removed: this.cleanedCount,
        suspicious_entries_found: this.suspiciousJudges.length,
        invalid_data_found: this.invalidJudges.length
      },
      removed_entries: this.suspiciousJudges,
      invalid_entries: this.invalidJudges.slice(0, 20), // First 20 for brevity
      actions_taken: [
        `Removed ${this.cleanedCount} test data entries`,
        `Identified ${this.invalidJudges.length} entries needing manual review`,
        'Created backup of removed data',
        'Updated database integrity'
      ]
    }
    
    // Save report
    const fs = require('fs').promises
    const reportPath = `./reports/cleaning-report-${Date.now()}.json`
    await fs.mkdir('./reports', { recursive: true })
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
    
    console.log('\n📊 CLEANING SUMMARY')
    console.log('=' .repeat(60))
    console.log(`Total Judges (After Cleaning): ${totalJudges}`)
    console.log(`Test Data Removed: ${this.cleanedCount}`)
    console.log(`Invalid Data Found: ${this.invalidJudges.length}`)
    console.log(`Total Cases: ${totalCases}`)
    console.log(`Analytics Cached: ${analyticsCount}`)
    console.log(`\nReport saved to: ${reportPath}`)
    console.log('=' .repeat(60))
  }
}

// Run the cleaner
async function main() {
  const cleaner = new JudgeDataCleaner()
  await cleaner.run()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { JudgeDataCleaner }