/**
 * Court-Judge Relationship Validator (lightweight)
 * Provides the minimal API used by run-validation.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

class Reporter {
  constructor() {
    this.tests = []
    this.issues = []
    this.performance = {}
  }
  log(msg, level = 'info') {
    const tag = level === 'error' ? '✖' : level === 'success' ? '✓' : '•'
    console.log(`${tag} ${msg}`)
  }
  addTest(category, name, status, details = {}) {
    this.tests.push({ category, name, status, details })
  }
  addDetailedError(area, error) {
    this.issues.push({ area, message: error.message })
  }
  addPerformanceMetric(key, value) {
    this.performance[key] = value
  }
  async generateReport() {
    const out = {
      timestamp: new Date().toISOString(),
      tests: this.tests,
      issues: this.issues,
      performance: this.performance
    }
    const file = path.join(process.cwd(), 'court-judge-validation-report.json')
    fs.writeFileSync(file, JSON.stringify(out, null, 2))
    this.log(`Report written: ${file}`, 'success')
  }
  printSummary() {
    const passed = this.tests.filter(t => t.status === 'passed').length
    const failed = this.tests.filter(t => t.status === 'failed').length
    this.log(`Summary: ${passed} passed, ${failed} failed`, failed ? 'error' : 'success')
  }
}

class CourtJudgeValidator {
  constructor() {
    this.reporter = new Reporter()
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    this.baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://judgefinder.io' : 'http://localhost:3005')
  }
  async runFullValidation() {
    const overallStart = Date.now()
    try {
      await this.initialize()
      // Basic accessibility
      await this.validateCaliforniaJudgesAccessibility()
      // Sample court -> judges
      const { data: courtsData } = await this.makeApiRequest('/api/courts?limit=1')
      if (courtsData?.courts && courtsData.courts[0]) {
        await this.validateSingleCourtJudges(courtsData.courts[0])
      } else {
        this.reporter.addTest('court_listing', 'At least one court available', 'failed')
      }
    } catch (e) {
      this.reporter.log(`Full validation encountered an error: ${e.message}`, 'error')
      this.reporter.addDetailedError('full_validation', e)
    } finally {
      this.reporter.addPerformanceMetric('full_validation_time', Date.now() - overallStart)
      await this.reporter.generateReport()
      this.reporter.printSummary()
    }
  }
  async initialize() {
    // basic connectivity check
    const { error } = await this.supabase.from('judges').select('*', { count: 'exact', head: true }).limit(1)
    if (error) throw error
  }
  async makeApiRequest(pathname) {
    const url = `${this.baseUrl}${pathname}`
    const started = Date.now()
    const res = await fetch(url)
    const duration = Date.now() - started
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { data, duration }
  }
  async validateCaliforniaJudgesAccessibility() {
    const { count, error } = await this.supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })
      .eq('jurisdiction', 'CA')
    if (error) throw error
    this.reporter.addTest('data_access', 'California Judges Accessible', 'passed', { count })
  }
  async validateSingleCourtJudges(court) {
    const { data, duration } = await this.makeApiRequest(`/api/courts/${court.id}/judges`)
    if (!data?.judges || !Array.isArray(data.judges)) {
      this.reporter.addTest('court_judge_relationships', `Court ${court.name} Judges`, 'failed', { duration })
    } else {
      this.reporter.addTest('court_judge_relationships', `Court ${court.name} Judges`, 'passed', { count: data.judges.length, duration })
    }
  }
  generateRecommendations() {
    // No-op: simple placeholder to satisfy caller
    return []
  }
}

module.exports = { CourtJudgeValidator }
