import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { chunkArray } from '@/lib/utils/helpers'
import { buildRateLimiter, getClientIp } from '@/lib/security/rate-limit'
import { redisGetJSON, redisSetJSON } from '@/lib/cache/redis'

// Import AI analytics pipeline
const { generateJudicialAnalytics, generateAnalyticsWithOpenAI } = require('@/lib/ai/judicial-analytics')

export const runtime = 'nodejs'
export const revalidate = 0

const LOOKBACK_YEARS = Math.max(1, parseInt(process.env.JUDGE_ANALYTICS_LOOKBACK_YEARS ?? '5', 10))
const CASE_FETCH_LIMIT = Math.max(200, parseInt(process.env.JUDGE_ANALYTICS_CASE_LIMIT ?? '1000', 10))

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
  
  // New metrics
  bail_release_rate: number
  appeal_reversal_rate: number
  settlement_encouragement_rate: number
  motion_grant_rate: number
  
  // Enhanced confidence metrics
  confidence_civil: number
  confidence_custody: number
  confidence_alimony: number
  confidence_contracts: number
  confidence_sentencing: number
  confidence_plea: number
  confidence_bail: number
  confidence_reversal: number
  confidence_settlement: number
  confidence_motion: number
  overall_confidence: number
  
  // Sample sizes for transparency
  sample_size_civil: number
  sample_size_custody: number
  sample_size_alimony: number
  sample_size_contracts: number
  sample_size_sentencing: number
  sample_size_plea: number
  sample_size_bail: number
  sample_size_reversal: number
  sample_size_settlement: number
  sample_size_motion: number
  
  total_cases_analyzed: number
  analysis_quality: string
  notable_patterns: string[]
  data_limitations: string[]
  ai_model: string
  generated_at: string
  last_updated: string
}

interface AnalysisWindow {
  lookbackYears: number
  startYear: number
  endYear: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limit per IP per judge analytics
    const rl = buildRateLimiter({ tokens: 20, window: '1 m', prefix: 'api:judge-analytics' })
    const ip = getClientIp(request)
    const judgeKey = (await params).id
    const { success, remaining } = await rl.limit(`${ip}:${judgeKey}`)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // Redis edge cache first
    const redisKey = `judge:analytics:${judgeKey}`
    const cachedRedis = await redisGetJSON<{ analytics: CaseAnalytics; created_at: string }>(redisKey)
    if (cachedRedis && isDataFresh(cachedRedis.created_at, 24)) {
      return NextResponse.json({
        analytics: cachedRedis.analytics,
        cached: true,
        data_source: 'redis_cache',
        last_updated: cachedRedis.created_at,
        rate_limit_remaining: remaining
      })
    }

    const resolvedParams = await params
    const supabase = await createServerClient()
    
    // Get judge data
    const { data: judge, error: judgeError } = await supabase
      .from('judges')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()

    if (judgeError || !judge) {
      return NextResponse.json(
        { error: 'Judge not found' },
        { status: 404 }
      )
    }

    // Check if we have cached analytics (less than 7 days old for real data)
    const cachedData = await getCachedAnalytics(supabase, resolvedParams.id)
    
    // Only use cached data if it has the new format (with confidence fields)
    if (cachedData && isDataFresh(cachedData.created_at, 7 * 24) && cachedData.analytics.confidence_civil) { // 7 days
      console.log(`📊 Using cached analytics for judge ${resolvedParams.id}`)
      return NextResponse.json({ 
        analytics: cachedData.analytics,
        cached: true,
        data_source: 'cached',
        last_updated: cachedData.created_at
      })
    }
    
    console.log(`🔄 Regenerating analytics for judge ${resolvedParams.id} (${cachedData ? 'old format' : 'no cache'})`)

    // Get cases for this judge from the configured lookback window
    const now = new Date()
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - LOOKBACK_YEARS)
    const lookbackStartDate = startDate.toISOString().split('T')[0]
    const analysisWindow = {
      lookbackYears: LOOKBACK_YEARS,
      startYear: startDate.getFullYear(),
      endYear: now.getFullYear()
    }
    
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('*')
      .eq('judge_id', resolvedParams.id)
      .gte('filing_date', lookbackStartDate) // Only cases filed within lookback window
      .order('filing_date', { ascending: false })
      .limit(CASE_FETCH_LIMIT)

    if (casesError) {
      console.error('Error fetching cases:', casesError)
      // Don't fail completely, continue with empty cases array
    }

    const enrichedCases = await enrichCasesWithOpinions(supabase, cases || [])

    // Generate analytics based on available data
    let analytics: CaseAnalytics

    if (enrichedCases.length === 0) {
      // No cases available - use traditional method with lower confidence
      analytics = await generateLegacyAnalytics(judge, analysisWindow)
    } else {
      // Generate analytics from real case data
      analytics = await generateAnalyticsFromCases(judge, enrichedCases, analysisWindow)
    }

    // Cache the results (Redis + DB fallback)
    await redisSetJSON(redisKey, { analytics, created_at: new Date().toISOString() }, 60 * 60 * 24)
    await cacheAnalytics(supabase, resolvedParams.id, analytics)

    return NextResponse.json({ 
      analytics,
      cached: false,
      data_source: enrichedCases.length > 0 ? 'case_analysis' : 'profile_estimation',
      document_count: enrichedCases.length,
      rate_limit_remaining: remaining
    })

  } catch (error) {
    console.error('Analytics generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate analytics', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate analytics from actual case data
 */
async function generateAnalyticsFromCases(judge: any, cases: any[], window: AnalysisWindow): Promise<CaseAnalytics> {
  try {
    console.log(`📊 Generating analytics for ${judge.name} using ${cases.length} cases`)
    
    // Analyze case patterns from the cases data
    const analytics = analyzeJudicialPatterns(judge, cases, window)
    
    // If we have AI available, enhance the analysis
    if (process.env.GOOGLE_AI_API_KEY || process.env.OPENAI_API_KEY) {
      try {
        return await enhanceAnalyticsWithAI(judge, cases, analytics, window)
      } catch (aiError) {
        console.log(`⚠️ AI enhancement failed for ${judge.name}, using statistical analysis:`, 
          aiError instanceof Error ? aiError.message : 'Unknown AI error')
        return analytics
      }
    }
    
    return analytics
    
  } catch (error) {
    console.error(`❌ Analytics generation failed for ${judge.name}:`, error)
    return generateConservativeAnalytics(judge, cases.length, window)
}
}

/**
 * Analyze judicial patterns from case data using statistical methods
 */
function analyzeJudicialPatterns(judge: any, cases: any[], window: AnalysisWindow): CaseAnalytics {
  console.log(`🔍 Analyzing ${cases.length} cases for statistical patterns`)
  
  // Initialize counters for different case types and outcomes
  const stats = {
    civil: { total: 0, plaintiff_wins: 0 },
    custody: { total: 0, mother_awards: 0 },
    alimony: { total: 0, awarded: 0 },
    contracts: { total: 0, enforced: 0 },
    criminal: { total: 0, strict_sentences: 0 },
    plea: { total: 0, accepted: 0 },
    bail: { total: 0, granted: 0 },
    reversal: { total: 0, reversed: 0 },
    settlement: { total: 0, encouraged: 0 },
    motion: { total: 0, granted: 0 }
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
    const mentionsPlea = summary.includes('plea') || outcome.includes('plea')
    if (mentionsPlea) {
      stats.plea.total++
      if (outcome.includes('plea accepted') || summary.includes('plea approved') || outcome.includes('guilty plea')) {
        stats.plea.accepted++
      }
    }

    // Bail/Pretrial Release decisions
    const mentionsBail =
      summary.includes('bail') ||
      summary.includes('pretrial release') ||
      summary.includes('pre-trial release') ||
      summary.includes('released on own recognizance') ||
      outcome.includes('bail') ||
      outcome.includes('release') ||
      outcome.includes('detained') ||
      outcome.includes('remand')

    if (mentionsBail) {
      stats.bail.total++
      if (outcome.includes('bail granted') || outcome.includes('released') || summary.includes('release granted') || 
          summary.includes('bail set') || !outcome.includes('remanded') && !outcome.includes('detained')) {
        stats.bail.granted++
      }
    }
    
    // Appeal/Reversal tracking
    if (caseType.includes('appeal') || summary.includes('appeal') || outcome.includes('appeal')) {
      stats.reversal.total++
      if (outcome.includes('reversed') || outcome.includes('overturned') || summary.includes('judgment reversed') ||
          summary.includes('decision overturned')) {
        stats.reversal.reversed++
      }
    }
    
    // Settlement encouragement
    if (caseType.includes('civil') || caseType.includes('contract') || caseType.includes('tort')) {
      if (summary.includes('settlement') || outcome.includes('settlement')) {
        stats.settlement.total++
        if (outcome.includes('settled') || summary.includes('settlement reached') || summary.includes('parties settled') ||
            summary.includes('settlement conference')) {
          stats.settlement.encouraged++
        }
      }
    }
    
    // Motion grant rate
    if (summary.includes('motion') || outcome.includes('motion')) {
      stats.motion.total++
      if (outcome.includes('granted') || outcome.includes('motion granted') || summary.includes('granted the motion') ||
          summary.includes('motion approved')) {
        stats.motion.granted++
      }
    }
  })
  
  // Calculate percentages with confidence based on sample sizes (improved for 3-year data)
  const calculateMetrics = (stat: Record<string, number>, successKey: string, label: string) => {
    if (stat.total === 0) return { percentage: 50, confidence: 60, sample: 0 }

    const successCount = Number(stat[successKey] ?? 0)
    const safeTotal = stat.total || 0
    const ratio = safeTotal > 0 ? successCount / safeTotal : 0.5
    const percentage = Math.round(Math.min(1, Math.max(0, ratio)) * 100)
    
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
    
    console.log(`${label}: ${successCount}/${safeTotal} = ${percentage}% (confidence: ${confidence}%)`)
    
    return { percentage, confidence, sample: stat.total }
  }
  
  const civilMetrics = calculateMetrics(stats.civil, 'plaintiff_wins', 'Civil')
  const custodyMetrics = calculateMetrics(stats.custody, 'mother_awards', 'Custody')
  const alimonyMetrics = calculateMetrics(stats.alimony, 'awarded', 'Alimony')
  const contractMetrics = calculateMetrics(stats.contracts, 'enforced', 'Contracts')
  const criminalMetrics = calculateMetrics(stats.criminal, 'strict_sentences', 'Criminal')
  const pleaMetrics = calculateMetrics(stats.plea, 'accepted', 'Plea')
  const bailMetrics = calculateMetrics(stats.bail, 'granted', 'Bail')
  const reversalMetrics = calculateMetrics(stats.reversal, 'reversed', 'Reversal')
  const settlementMetrics = calculateMetrics(stats.settlement, 'encouraged', 'Settlement')
  const motionMetrics = calculateMetrics(stats.motion, 'granted', 'Motion')
  
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
  if (totalCases > 200) patterns.push(`Comprehensive ${window.lookbackYears}-year analysis: ${totalCases} cases analyzed`)
  else if (totalCases > 100) patterns.push(`Substantial ${window.lookbackYears}-year dataset: ${totalCases} cases analyzed`)
  else if (totalCases > 50) patterns.push(`Moderate ${window.lookbackYears}-year dataset: ${totalCases} cases analyzed`)
  else if (totalCases < 50) limitations.push(`Limited ${window.lookbackYears}-year data: only ${totalCases} cases available`)
  
  // Case type distribution analysis
  if (stats.civil.total > 20) patterns.push(`Civil cases: ${Math.round(stats.civil.total/totalCases*100)}% of ${window.lookbackYears}-year caseload`)
  if (stats.criminal.total > 20) patterns.push(`Criminal cases: ${Math.round(stats.criminal.total/totalCases*100)}% of ${window.lookbackYears}-year caseload`)
  if (stats.custody.total > 10) patterns.push(`Family custody cases: ${Math.round(stats.custody.total/totalCases*100)}% of caseload`)
  
  // Add 3-year timeframe context
  const timeframeLabel = window.startYear === window.endYear
    ? `${window.startYear}`
    : `${window.startYear}-${window.endYear}`
  patterns.push(`Analysis covers cases filed from ${timeframeLabel}`)
  
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
    
    // New metrics
    bail_release_rate: bailMetrics.percentage,
    appeal_reversal_rate: reversalMetrics.percentage,
    settlement_encouragement_rate: settlementMetrics.percentage,
    motion_grant_rate: motionMetrics.percentage,
    
    confidence_civil: civilMetrics.confidence,
    confidence_custody: custodyMetrics.confidence,
    confidence_alimony: alimonyMetrics.confidence,
    confidence_contracts: contractMetrics.confidence,
    confidence_sentencing: criminalMetrics.confidence,
    confidence_plea: pleaMetrics.confidence,
    confidence_bail: bailMetrics.confidence,
    confidence_reversal: reversalMetrics.confidence,
    confidence_settlement: settlementMetrics.confidence,
    confidence_motion: motionMetrics.confidence,
    overall_confidence: Math.round(overallConfidence),
    
    sample_size_civil: civilMetrics.sample,
    sample_size_custody: custodyMetrics.sample,
    sample_size_alimony: alimonyMetrics.sample,
    sample_size_contracts: contractMetrics.sample,
    sample_size_sentencing: criminalMetrics.sample,
    sample_size_plea: pleaMetrics.sample,
    sample_size_bail: bailMetrics.sample,
    sample_size_reversal: reversalMetrics.sample,
    sample_size_settlement: settlementMetrics.sample,
    sample_size_motion: motionMetrics.sample,
    
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
async function enhanceAnalyticsWithAI(
  judge: any,
  cases: any[],
  baseAnalytics: CaseAnalytics,
  window: AnalysisWindow
): Promise<CaseAnalytics> {
  const analyzableDocuments = cases
    .filter(doc => doc.plain_text)
    .map(doc => ({
      case_name: doc.case_name || 'Unknown Case',
      case_category: doc.case_type || doc.case_category || 'Unknown',
      case_subcategory: doc.case_subcategory || doc.case_type_subcategory || null,
      case_outcome: doc.outcome || doc.status || 'Unknown',
      decision_date: doc.decision_date || doc.filing_date || null,
      plain_text: doc.plain_text,
      analyzable: doc.analyzable !== false
    }))
    .filter(doc => doc.analyzable && doc.plain_text)
    .slice(0, 60)

  if (analyzableDocuments.length === 0) {
    console.log('🤖 No analyzable case documents available for AI enhancement')
    return baseAnalytics
  }

  let aiAnalytics: any = null

  try {
    aiAnalytics = await generateJudicialAnalytics(judge, analyzableDocuments)

    if (aiAnalytics?.ai_model === 'fallback' && process.env.OPENAI_API_KEY) {
      console.log('🤖 Gemini fallback detected, attempting OpenAI backup')
      aiAnalytics = await generateAnalyticsWithOpenAI(judge, analyzableDocuments)
    }
  } catch (error) {
    console.error('AI analytics generation failed, attempting fallback if available', error)
    if (process.env.OPENAI_API_KEY) {
      try {
        aiAnalytics = await generateAnalyticsWithOpenAI(judge, analyzableDocuments)
      } catch (fallbackError) {
        console.error('OpenAI fallback also failed:', fallbackError)
      }
    }
  }

  if (!aiAnalytics || aiAnalytics.ai_model === 'fallback') {
    return baseAnalytics
  }

  const blendNumericMetric = (
    metric: string,
    sampleKey: string,
    defaultValue: number
  ) => {
    const baseValue = Number((baseAnalytics as any)[metric] ?? defaultValue)
    const aiValue = Number(aiAnalytics[metric] ?? defaultValue)
    const baseSample = Number((baseAnalytics as any)[sampleKey] ?? baseAnalytics.total_cases_analyzed)
    const aiSample = Number(aiAnalytics[sampleKey] ?? aiAnalytics.total_cases_analyzed)

    const totalWeight = Math.max(0, (isFinite(baseSample) ? baseSample : 0)) + Math.max(0, (isFinite(aiSample) ? aiSample : 0))

    if (!totalWeight) {
      return Math.round((baseValue + aiValue) / 2)
    }

    return Math.round(
      ((isFinite(baseSample) ? baseSample : 0) * baseValue + (isFinite(aiSample) ? aiSample : 0) * aiValue) /
        totalWeight
    )
  }

  const blendConfidence = (key: string) => {
    const baseValue = Number((baseAnalytics as any)[key] ?? 60)
    const aiValue = Number(aiAnalytics[key] ?? 60)
    const baseSample = Math.max(0, baseAnalytics.total_cases_analyzed)
    const aiSample = Math.max(0, aiAnalytics.total_cases_analyzed ?? analyzableDocuments.length)
    const totalWeight = baseSample + aiSample

    if (!totalWeight) {
      return Math.round((baseValue + aiValue) / 2)
    }

    return Math.round((baseValue * baseSample + aiValue * aiSample) / totalWeight)
  }

  const blendedCivil = blendNumericMetric('civil_plaintiff_favor', 'sample_size_civil', baseAnalytics.civil_plaintiff_favor)
  const blendedCustody = blendNumericMetric('family_custody_mother', 'sample_size_custody', baseAnalytics.family_custody_mother)
  const blendedAlimony = blendNumericMetric('family_alimony_favorable', 'sample_size_alimony', baseAnalytics.family_alimony_favorable)
  const blendedContracts = blendNumericMetric('contract_enforcement_rate', 'sample_size_contracts', baseAnalytics.contract_enforcement_rate)
  const blendedCriminal = blendNumericMetric('criminal_sentencing_severity', 'sample_size_sentencing', baseAnalytics.criminal_sentencing_severity)
  const blendedPlea = blendNumericMetric('criminal_plea_acceptance', 'sample_size_plea', baseAnalytics.criminal_plea_acceptance)

  const merged: CaseAnalytics = {
    ...baseAnalytics,
    civil_plaintiff_favor: blendedCivil,
    civil_defendant_favor: 100 - blendedCivil,
    family_custody_mother: blendedCustody,
    family_custody_father: 100 - blendedCustody,
    family_alimony_favorable: blendedAlimony,
    contract_enforcement_rate: blendedContracts,
    contract_dismissal_rate: 100 - blendedContracts,
    criminal_sentencing_severity: blendedCriminal,
    criminal_plea_acceptance: blendedPlea,
    confidence_civil: blendConfidence('confidence_civil'),
    confidence_custody: blendConfidence('confidence_custody'),
    confidence_alimony: blendConfidence('confidence_alimony'),
    confidence_contracts: blendConfidence('confidence_contracts'),
    confidence_sentencing: blendConfidence('confidence_sentencing'),
    confidence_plea: blendConfidence('confidence_plea'),
    overall_confidence: blendConfidence('overall_confidence'),
    notable_patterns: Array.from(
      new Set([...(baseAnalytics.notable_patterns || []), ...(aiAnalytics.notable_patterns || [])].filter(Boolean))
    ),
    data_limitations: Array.from(
      new Set([...(baseAnalytics.data_limitations || []), ...(aiAnalytics.data_limitations || [])].filter(Boolean))
    ),
    analysis_quality: 'augmented_ai',
    ai_model: aiAnalytics.ai_model,
    generated_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    total_cases_analyzed: baseAnalytics.total_cases_analyzed
  }

  // Append context about AI blending
  const aiPattern = `AI-enhanced review of ${analyzableDocuments.length} case documents within ${window.lookbackYears}-year window`
  if (!merged.notable_patterns.includes(aiPattern)) {
    merged.notable_patterns.push(aiPattern)
  }

  const aiLimitation = `AI analysis limited to ${analyzableDocuments.length} documents (${window.startYear}-${window.endYear})`
  if (!merged.data_limitations.includes(aiLimitation)) {
    merged.data_limitations.push(aiLimitation)
  }

  return merged
}

/**
 * Attach opinion text to case records so analytics and AI have analyzable content
 */
async function enrichCasesWithOpinions(supabase: any, cases: any[]): Promise<any[]> {
  if (!cases || cases.length === 0) {
    return []
  }

  const caseMap = new Map<string, any>()
  const caseIds: string[] = []

  for (const caseItem of cases) {
    if (!caseItem?.id) continue
    caseMap.set(caseItem.id, { ...caseItem })
    caseIds.push(caseItem.id)
  }

  if (caseIds.length === 0) {
    return Array.from(caseMap.values())
  }

  const batches = chunkArray(caseIds, 100)

  for (const batch of batches) {
    const { data: opinions, error } = await supabase
      .from('opinions')
      .select('case_id, opinion_type, plain_text, opinion_text, html_text')
      .in('case_id', batch)

    if (error) {
      console.error('Failed to fetch opinions for cases', { error, batchSize: batch.length })
      continue
    }

    for (const opinion of opinions || []) {
      if (!opinion?.case_id) continue
      const targetCase = caseMap.get(opinion.case_id)
      if (!targetCase) continue

      const opinionText = extractOpinionText(opinion)
      if (!opinionText) continue

      const isLeadOpinion = opinion.opinion_type === 'lead'
      if (!targetCase.plain_text || isLeadOpinion) {
        targetCase.plain_text = opinionText
        targetCase.analyzable = true
      }
    }
  }

  return Array.from(caseMap.values())
}

function extractOpinionText(opinion: any): string | null {
  if (!opinion) return null

  if (opinion.plain_text && typeof opinion.plain_text === 'string') {
    return opinion.plain_text
  }

  if (opinion.opinion_text && typeof opinion.opinion_text === 'string') {
    return opinion.opinion_text
  }

  if (opinion.html_text && typeof opinion.html_text === 'string') {
    return opinion.html_text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || null
  }

  return null
}

/**
 * Generate legacy analytics for judges without cases
 */
async function generateLegacyAnalytics(judge: any, window: AnalysisWindow): Promise<CaseAnalytics> {
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
    
    // New metrics - conservative estimates
    bail_release_rate: 65 + baseAdjustment,
    appeal_reversal_rate: 15,
    settlement_encouragement_rate: 60,
    motion_grant_rate: 45,
    
    // Lower confidence for profile-based estimates
    confidence_civil: 65,
    confidence_custody: 65,
    confidence_alimony: 65,
    confidence_contracts: 65,
    confidence_sentencing: 65,
    confidence_plea: 65,
    confidence_bail: 60,
    confidence_reversal: 60,
    confidence_settlement: 60,
    confidence_motion: 60,
    overall_confidence: 65,
    
    sample_size_civil: 0,
    sample_size_custody: 0,
    sample_size_alimony: 0,
    sample_size_contracts: 0,
    sample_size_sentencing: 0,
    sample_size_plea: 0,
    sample_size_bail: 0,
    sample_size_reversal: 0,
    sample_size_settlement: 0,
    sample_size_motion: 0,
    
    total_cases_analyzed: 0,
    analysis_quality: 'profile_based',
    notable_patterns: [
      'Analysis based on judicial profile and jurisdiction patterns',
      `No case data available within ${window.lookbackYears}-year window (${window.startYear}-${window.endYear})`
    ],
    data_limitations: ['No case data available', 'Estimates based on regional and court type patterns'],
    ai_model: 'statistical_estimation',
    generated_at: new Date().toISOString(),
    last_updated: new Date().toISOString()
  }
}

/**
 * Generate conservative analytics when AI fails
 */
function generateConservativeAnalytics(judge: any, caseCount: number, window: AnalysisWindow): CaseAnalytics {
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
    
    // New metrics - conservative defaults
    bail_release_rate: 60,
    appeal_reversal_rate: 15,
    settlement_encouragement_rate: 55,
    motion_grant_rate: 45,
    
    // Conservative confidence scores
    confidence_civil: 60,
    confidence_custody: 60,
    confidence_alimony: 60,
    confidence_contracts: 60,
    confidence_sentencing: 60,
    confidence_plea: 60,
    confidence_bail: 60,
    confidence_reversal: 60,
    confidence_settlement: 60,
    confidence_motion: 60,
    overall_confidence: 60,
    
    sample_size_civil: 0,
    sample_size_custody: 0,
    sample_size_alimony: 0,
    sample_size_contracts: 0,
    sample_size_sentencing: 0,
    sample_size_plea: 0,
    sample_size_bail: 0,
    sample_size_reversal: 0,
    sample_size_settlement: 0,
    sample_size_motion: 0,
    
    total_cases_analyzed: caseCount,
    analysis_quality: 'conservative',
    notable_patterns: ['Conservative estimates due to AI processing limitations'],
    data_limitations: [
      'AI analysis unavailable',
      'Using statistical defaults',
      `Window analyzed: ${window.startYear}-${window.endYear}`
    ],
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
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
      .eq('judge_id', resolvedParams.id)

    // Regenerate analytics
    const response = await GET(request, { params: Promise.resolve(resolvedParams) })
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
