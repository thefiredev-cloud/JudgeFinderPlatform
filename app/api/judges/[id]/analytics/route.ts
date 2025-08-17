import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Import AI analytics pipeline
const { generateJudicialAnalytics, generateAnalyticsWithOpenAI } = require('@/lib/ai/judicial-analytics')

interface CaseAnalytics {
  civil_plaintiff_favor: number
  civil_defendant_favor: number
  family_custody_mother: number
  family_custody_father: number
  family_alimony_favorable: number
  contract_enforcement_rate: number
  contract_dismissal_rate: number
  criminal_sentencing_severity: number
  criminal_plea_acceptance: number
  
  // Enhanced confidence metrics
  confidence_civil: number
  confidence_custody: number
  confidence_alimony: number
  confidence_contracts: number
  confidence_sentencing: number
  confidence_plea: number
  overall_confidence: number
  
  // Sample sizes for transparency
  sample_size_civil: number
  sample_size_custody: number
  sample_size_alimony: number
  sample_size_contracts: number
  sample_size_sentencing: number
  sample_size_plea: number
  
  total_cases_analyzed: number
  analysis_quality: string
  notable_patterns: string[]
  data_limitations: string[]
  ai_model: string
  generated_at: string
  last_updated: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    
    // Get judge data
    const { data: judge, error: judgeError } = await supabase
      .from('judges')
      .select('*')
      .eq('id', params.id)
      .single()

    if (judgeError || !judge) {
      return NextResponse.json(
        { error: 'Judge not found' },
        { status: 404 }
      )
    }

    // Check if we have cached analytics (less than 7 days old for real data)
    const cachedData = await getCachedAnalytics(supabase, params.id)
    
    // Only use cached data if it has the new format (with confidence fields)
    if (cachedData && isDataFresh(cachedData.created_at, 7 * 24) && cachedData.analytics.confidence_civil) { // 7 days
      console.log(`📊 Using cached analytics for judge ${params.id}`)
      return NextResponse.json({ 
        analytics: cachedData.analytics,
        cached: true,
        data_source: 'cached',
        last_updated: cachedData.created_at
      })
    }
    
    console.log(`🔄 Regenerating analytics for judge ${params.id} (${cachedData ? 'old format' : 'no cache'})`)

    // Get cases for this judge from the last 3 years (2022-2025)
    const threeYearsAgo = new Date()
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)
    const threeYearsAgoDate = threeYearsAgo.toISOString().split('T')[0]
    
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('*')
      .eq('judge_id', params.id)
      .gte('filing_date', threeYearsAgoDate) // Only cases filed in last 3 years
      .order('filing_date', { ascending: false })
      .limit(500) // Increased limit for 3-year data

    if (casesError) {
      console.error('Error fetching cases:', casesError)
      // Don't fail completely, continue with empty cases array
    }

    // Generate analytics based on available data
    let analytics: CaseAnalytics

    if (!cases || cases.length === 0) {
      // No cases available - use traditional method with lower confidence
      analytics = await generateLegacyAnalytics(judge)
    } else {
      // Generate analytics from real case data
      analytics = await generateAnalyticsFromCases(judge, cases)
    }

    // Cache the results
    await cacheAnalytics(supabase, params.id, analytics)

    return NextResponse.json({ 
      analytics,
      cached: false,
      data_source: cases?.length > 0 ? 'case_analysis' : 'profile_estimation',
      document_count: cases?.length || 0
    })

  } catch (error) {
    console.error('Analytics generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate analytics', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Generate analytics from actual case data
 */
async function generateAnalyticsFromCases(judge: any, cases: any[]): Promise<CaseAnalytics> {
  try {
    console.log(`📊 Generating analytics for ${judge.name} using ${cases.length} cases`)
    
    // Analyze case patterns from the cases data
    const analytics = analyzeJudicialPatterns(judge, cases)
    
    // If we have AI available, enhance the analysis
    if (process.env.GOOGLE_AI_API_KEY || process.env.OPENAI_API_KEY) {
      try {
        return await enhanceAnalyticsWithAI(judge, cases, analytics)
      } catch (aiError) {
        console.log(`⚠️ AI enhancement failed for ${judge.name}, using statistical analysis:`, aiError.message)
        return analytics
      }
    }
    
    return analytics
    
  } catch (error) {
    console.error(`❌ Analytics generation failed for ${judge.name}:`, error)
    return generateConservativeAnalytics(judge, cases.length)
  }
}

/**
 * Analyze judicial patterns from case data using statistical methods
 */
function analyzeJudicialPatterns(judge: any, cases: any[]): CaseAnalytics {
  console.log(`🔍 Analyzing ${cases.length} cases for statistical patterns`)
  
  // Initialize counters for different case types and outcomes
  const stats = {
    civil: { total: 0, plaintiff_wins: 0 },
    custody: { total: 0, mother_awards: 0 },
    alimony: { total: 0, awarded: 0 },
    contracts: { total: 0, enforced: 0 },
    criminal: { total: 0, strict_sentences: 0 },
    plea: { total: 0, accepted: 0 }
  }
  
  // Analyze each case based on case_type and outcome
  cases.forEach(case_item => {
    const caseType = (case_item.case_type || '').toLowerCase()
    const outcome = (case_item.outcome || '').toLowerCase()
    const summary = (case_item.summary || '').toLowerCase()
    const status = (case_item.status || '').toLowerCase()
    
    // Civil cases analysis
    if (caseType.includes('civil') || caseType.includes('tort') || caseType.includes('personal injury')) {
      stats.civil.total++
      if (outcome.includes('plaintiff') || outcome.includes('awarded') || summary.includes('in favor of plaintiff')) {
        stats.civil.plaintiff_wins++
      }
    }
    
    // Family law - custody cases
    if (caseType.includes('custody') || caseType.includes('family') || summary.includes('child custody')) {
      stats.custody.total++
      if (outcome.includes('mother') || summary.includes('custody to mother') || summary.includes('maternal custody')) {
        stats.custody.mother_awards++
      }
    }
    
    // Family law - alimony/spousal support
    if (caseType.includes('divorce') || caseType.includes('family') || summary.includes('alimony') || summary.includes('spousal support')) {
      stats.alimony.total++
      if (outcome.includes('alimony') || outcome.includes('spousal support') || summary.includes('awarded spousal')) {
        stats.alimony.awarded++
      }
    }
    
    // Contract disputes
    if (caseType.includes('contract') || caseType.includes('breach') || summary.includes('contract dispute')) {
      stats.contracts.total++
      if (outcome.includes('enforced') || outcome.includes('breach found') || summary.includes('contract upheld') || 
          !outcome.includes('dismissed') && status === 'decided') {
        stats.contracts.enforced++
      }
    }
    
    // Criminal sentencing
    if (caseType.includes('criminal') || caseType.includes('felony') || caseType.includes('misdemeanor')) {
      stats.criminal.total++
      if (outcome.includes('prison') || outcome.includes('years') || summary.includes('sentenced to')) {
        stats.criminal.strict_sentences++
      }
    }
    
    // Plea deals
    if (caseType.includes('criminal') || summary.includes('plea')) {
      stats.plea.total++
      if (outcome.includes('plea accepted') || summary.includes('plea approved') || outcome.includes('guilty plea')) {
        stats.plea.accepted++
      }
    }
  })
  
  // Calculate percentages with confidence based on sample sizes (improved for 3-year data)
  const calculateMetrics = (stat: any, label: string) => {
    if (stat.total === 0) return { percentage: 50, confidence: 60, sample: 0 }
    
    const percentage = Math.round((stat.total > 0 ? (Object.values(stat)[1] as number) / stat.total : 0.5) * 100)
    
    // Improved confidence calculation for larger sample sizes
    let confidence = 60 // Base confidence
    if (stat.total >= 50) confidence = 90
    else if (stat.total >= 30) confidence = 85
    else if (stat.total >= 20) confidence = 80
    else if (stat.total >= 10) confidence = 75
    else if (stat.total >= 5) confidence = 70
    else confidence = 65
    
    // Cap at 95% max confidence
    confidence = Math.min(95, confidence)
    
    console.log(`${label}: ${Object.values(stat)[1]}/${stat.total} = ${percentage}% (confidence: ${confidence}%)`)
    
    return { percentage, confidence, sample: stat.total }
  }
  
  const civilMetrics = calculateMetrics(stats.civil, 'Civil')
  const custodyMetrics = calculateMetrics(stats.custody, 'Custody')
  const alimonyMetrics = calculateMetrics(stats.alimony, 'Alimony')
  const contractMetrics = calculateMetrics(stats.contracts, 'Contracts')
  const criminalMetrics = calculateMetrics(stats.criminal, 'Criminal')
  const pleaMetrics = calculateMetrics(stats.plea, 'Plea')
  
  // Calculate overall confidence based on 3-year data
  const totalCases = cases.length
  let overallConfidence = 65 // Base confidence
  
  if (totalCases >= 200) overallConfidence = 95
  else if (totalCases >= 150) overallConfidence = 90
  else if (totalCases >= 100) overallConfidence = 85
  else if (totalCases >= 75) overallConfidence = 80
  else if (totalCases >= 50) overallConfidence = 75
  else if (totalCases >= 25) overallConfidence = 70
  
  const patterns = []
  const limitations = []
  
  // Enhanced pattern detection for 3-year data
  if (totalCases > 200) patterns.push(`Comprehensive 3-year analysis: ${totalCases} cases analyzed`)
  else if (totalCases > 100) patterns.push(`Substantial 3-year dataset: ${totalCases} cases analyzed`)
  else if (totalCases > 50) patterns.push(`Moderate 3-year dataset: ${totalCases} cases analyzed`)
  else if (totalCases < 50) limitations.push(`Limited 3-year data: only ${totalCases} cases available`)
  
  // Case type distribution analysis
  if (stats.civil.total > 20) patterns.push(`Civil cases: ${Math.round(stats.civil.total/totalCases*100)}% of 3-year caseload`)
  if (stats.criminal.total > 20) patterns.push(`Criminal cases: ${Math.round(stats.criminal.total/totalCases*100)}% of 3-year caseload`)
  if (stats.custody.total > 10) patterns.push(`Family custody cases: ${Math.round(stats.custody.total/totalCases*100)}% of caseload`)
  
  // Add 3-year timeframe context
  patterns.push('Analysis covers cases filed from 2022-2025')
  
  return {
    civil_plaintiff_favor: civilMetrics.percentage,
    civil_defendant_favor: 100 - civilMetrics.percentage,
    family_custody_mother: custodyMetrics.percentage,
    family_custody_father: 100 - custodyMetrics.percentage,
    family_alimony_favorable: alimonyMetrics.percentage,
    contract_enforcement_rate: contractMetrics.percentage,
    contract_dismissal_rate: 100 - contractMetrics.percentage,
    criminal_sentencing_severity: criminalMetrics.percentage,
    criminal_plea_acceptance: pleaMetrics.percentage,
    
    confidence_civil: civilMetrics.confidence,
    confidence_custody: custodyMetrics.confidence,
    confidence_alimony: alimonyMetrics.confidence,
    confidence_contracts: contractMetrics.confidence,
    confidence_sentencing: criminalMetrics.confidence,
    confidence_plea: pleaMetrics.confidence,
    overall_confidence: Math.round(overallConfidence),
    
    sample_size_civil: civilMetrics.sample,
    sample_size_custody: custodyMetrics.sample,
    sample_size_alimony: alimonyMetrics.sample,
    sample_size_contracts: contractMetrics.sample,
    sample_size_sentencing: criminalMetrics.sample,
    sample_size_plea: pleaMetrics.sample,
    
    total_cases_analyzed: totalCases,
    analysis_quality: totalCases > 150 ? 'excellent' : totalCases > 100 ? 'high' : totalCases > 50 ? 'medium' : 'low',
    notable_patterns: patterns.length > 0 ? patterns : ['Statistical analysis based on 3-year case outcomes'],
    data_limitations: limitations.length > 0 ? limitations : ['Analysis based on available 3-year case outcome data'],
    ai_model: 'statistical_analysis_3year',
    generated_at: new Date().toISOString(),
    last_updated: new Date().toISOString()
  }
}

/**
 * Enhance statistical analytics with AI analysis (when available)
 */
async function enhanceAnalyticsWithAI(judge: any, cases: any[], baseAnalytics: CaseAnalytics): Promise<CaseAnalytics> {
  // For now, return the base analytics
  // This can be enhanced later when AI integration is fully configured
  console.log(`🤖 AI enhancement not yet implemented, using statistical analysis`)
  return baseAnalytics
}

/**
 * Generate legacy analytics for judges without cases
 */
async function generateLegacyAnalytics(judge: any): Promise<CaseAnalytics> {
  console.log(`📊 Generating legacy analytics for ${judge.name} (no cases available)`)
  
  // Conservative estimates based on jurisdiction and court type
  const isCaliforniaJudge = judge.jurisdiction?.toLowerCase().includes('ca') || 
                           judge.jurisdiction?.toLowerCase().includes('california')
  
  // California tends to be more liberal in family law, more business-friendly in contracts
  const baseAdjustment = isCaliforniaJudge ? 5 : 0
  
  return {
    civil_plaintiff_favor: 48 + baseAdjustment,
    civil_defendant_favor: 52 - baseAdjustment,
    family_custody_mother: 52 + baseAdjustment,
    family_custody_father: 48 - baseAdjustment,
    family_alimony_favorable: 42 + baseAdjustment,
    contract_enforcement_rate: 68 - baseAdjustment,
    contract_dismissal_rate: 32 + baseAdjustment,
    criminal_sentencing_severity: 50,
    criminal_plea_acceptance: 75,
    
    // Lower confidence for profile-based estimates
    confidence_civil: 65,
    confidence_custody: 65,
    confidence_alimony: 65,
    confidence_contracts: 65,
    confidence_sentencing: 65,
    confidence_plea: 65,
    overall_confidence: 65,
    
    sample_size_civil: 0,
    sample_size_custody: 0,
    sample_size_alimony: 0,
    sample_size_contracts: 0,
    sample_size_sentencing: 0,
    sample_size_plea: 0,
    
    total_cases_analyzed: 0,
    analysis_quality: 'profile_based',
    notable_patterns: ['Analysis based on judicial profile and jurisdiction patterns'],
    data_limitations: ['No case data available', 'Estimates based on regional and court type patterns'],
    ai_model: 'statistical_estimation',
    generated_at: new Date().toISOString(),
    last_updated: new Date().toISOString()
  }
}

/**
 * Generate conservative analytics when AI fails
 */
function generateConservativeAnalytics(judge: any, caseCount: number): CaseAnalytics {
  console.log(`🛡️  Generating conservative analytics for ${judge.name} (${caseCount} cases, analysis failed)`)
  
  return {
    civil_plaintiff_favor: 50,
    civil_defendant_favor: 50,
    family_custody_mother: 50,
    family_custody_father: 50,
    family_alimony_favorable: 40,
    contract_enforcement_rate: 65,
    contract_dismissal_rate: 35,
    criminal_sentencing_severity: 50,
    criminal_plea_acceptance: 70,
    
    // Conservative confidence scores
    confidence_civil: 60,
    confidence_custody: 60,
    confidence_alimony: 60,
    confidence_contracts: 60,
    confidence_sentencing: 60,
    confidence_plea: 60,
    overall_confidence: 60,
    
    sample_size_civil: 0,
    sample_size_custody: 0,
    sample_size_alimony: 0,
    sample_size_contracts: 0,
    sample_size_sentencing: 0,
    sample_size_plea: 0,
    
    total_cases_analyzed: caseCount,
    analysis_quality: 'conservative',
    notable_patterns: ['Conservative estimates due to AI processing limitations'],
    data_limitations: ['AI analysis unavailable', 'Using statistical defaults'],
    ai_model: 'conservative_fallback',
    generated_at: new Date().toISOString(),
    last_updated: new Date().toISOString()
  }
}

/**
 * Get cached analytics from database
 */
async function getCachedAnalytics(supabase: any, judgeId: string) {
  try {
    // Try cache table first
    const { data: cacheData, error: cacheError } = await supabase
      .from('judge_analytics_cache')
      .select('analytics, created_at')
      .eq('judge_id', judgeId)
      .single()

    if (cacheData && !cacheError) {
      return {
        analytics: cacheData.analytics,
        created_at: cacheData.created_at
      }
    }

    // Fallback to judges table
    const { data: judgeData, error: judgeError } = await supabase
      .from('judges')
      .select('case_analytics, updated_at')
      .eq('id', judgeId)
      .single()

    if (judgeData?.case_analytics && !judgeError) {
      return {
        analytics: judgeData.case_analytics,
        created_at: judgeData.updated_at
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Cache analytics results
 */
async function cacheAnalytics(supabase: any, judgeId: string, analytics: CaseAnalytics) {
  try {
    // Try to cache in dedicated table first
    const { error: cacheError } = await supabase
      .from('judge_analytics_cache')
      .upsert({
        judge_id: judgeId,
        analytics,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'judge_id'
      })

    if (!cacheError) {
      console.log(`💾 Cached analytics for judge ${judgeId}`)
      return
    }

    // Fallback to judges table
    await supabase
      .from('judges')
      .update({
        case_analytics: analytics,
        updated_at: new Date().toISOString()
      })
      .eq('id', judgeId)
      
    console.log(`💾 Cached analytics in judges table for ${judgeId}`)
  } catch (error) {
    console.error('Failed to cache analytics:', error)
  }
}

/**
 * Check if cached data is still fresh
 */
function isDataFresh(createdAt: string, maxAgeHours: number): boolean {
  const cacheTime = new Date(createdAt).getTime()
  const now = Date.now()
  const hoursDiff = (now - cacheTime) / (1000 * 60 * 60)
  return hoursDiff < maxAgeHours
}

/**
 * Force refresh analytics (for admin use)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('force') === 'true'
    
    if (!forceRefresh) {
      return NextResponse.json(
        { error: 'Force refresh required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()
    
    // Clear existing cache
    await supabase
      .from('judge_analytics_cache')
      .delete()
      .eq('judge_id', params.id)

    // Regenerate analytics
    const response = await GET(request, { params })
    const data = await response.json()
    
    return NextResponse.json({
      message: 'Analytics refreshed successfully',
      analytics: data.analytics
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to refresh analytics' },
      { status: 500 }
    )
  }
}