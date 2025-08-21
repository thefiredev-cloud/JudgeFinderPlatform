import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface BiasAnalysisParams {
  params: { id: string }
}

interface CaseTypePattern {
  case_type: string
  total_cases: number
  settlement_rate: number
  average_case_value: number
  outcome_distribution: {
    settled: number
    dismissed: number
    judgment: number
    other: number
  }
}

interface TemporalPattern {
  year: number
  month: number
  case_count: number
  settlement_rate: number
  average_duration: number
}

interface BiasMetrics {
  case_type_patterns: CaseTypePattern[]
  outcome_analysis: {
    overall_settlement_rate: number
    dismissal_rate: number
    judgment_rate: number
    average_case_duration: number
    case_value_trends: Array<{
      value_range: string
      case_count: number
      settlement_rate: number
    }>
  }
  temporal_patterns: TemporalPattern[]
  bias_indicators: {
    consistency_score: number
    speed_score: number
    settlement_preference: number
    risk_tolerance: number
    predictability_score: number
  }
}

export async function GET(request: NextRequest, { params }: BiasAnalysisParams) {
  try {
    const supabase = await createServerClient()
    const judgeId = params.id

    // Verify judge exists
    const { data: judge, error: judgeError } = await supabase
      .from('judges')
      .select('id, name')
      .eq('id', judgeId)
      .single()

    if (judgeError || !judge) {
      return NextResponse.json(
        { error: 'Judge not found' },
        { status: 404 }
      )
    }

    // Get all cases for this judge
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('*')
      .eq('judge_id', judgeId)
      .not('decision_date', 'is', null)

    if (casesError) {
      return NextResponse.json(
        { error: 'Failed to fetch case data' },
        { status: 500 }
      )
    }

    if (!cases || cases.length === 0) {
      return NextResponse.json(
        { error: 'No case data available for bias analysis' },
        { status: 404 }
      )
    }

    // Analyze case type patterns
    const caseTypePatterns = analyzeCaseTypePatterns(cases)
    
    // Analyze outcomes
    const outcomeAnalysis = analyzeOutcomes(cases)
    
    // Analyze temporal patterns
    const temporalPatterns = analyzeTemporalPatterns(cases)
    
    // Calculate bias indicators
    const biasIndicators = calculateBiasIndicators(cases, caseTypePatterns, outcomeAnalysis)

    const biasMetrics: BiasMetrics = {
      case_type_patterns: caseTypePatterns,
      outcome_analysis: outcomeAnalysis,
      temporal_patterns: temporalPatterns,
      bias_indicators: biasIndicators
    }

    return NextResponse.json(biasMetrics, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, max-age=900, stale-while-revalidate=900'
      }
    })

  } catch (error) {
    console.error('Error generating bias analysis:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function analyzeCaseTypePatterns(cases: any[]): CaseTypePattern[] {
  const caseTypeGroups = cases.reduce((groups, case_) => {
    const caseType = case_.case_type || 'Other'
    if (!groups[caseType]) {
      groups[caseType] = []
    }
    groups[caseType].push(case_)
    return groups
  }, {} as Record<string, any[]>)

  return Object.entries(caseTypeGroups).map(([caseType, casesInType]) => {
    const typedCases = casesInType as any[]
    const outcomes = typedCases.reduce((acc: Record<string, number>, case_: any) => {
      const outcome = normalizeOutcome(case_.outcome || case_.status)
      acc[outcome] = (acc[outcome] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalCases = typedCases.length
    const settledCases = outcomes.settled || 0
    const dismissedCases = outcomes.dismissed || 0
    const judgmentCases = outcomes.judgment || 0
    const otherCases = totalCases - settledCases - dismissedCases - judgmentCases

    // Calculate average case value (if available)
    const validCaseValues = typedCases
      .map((c: any) => c.case_value)
      .filter((v: any) => v && !isNaN(v))
    const averageCaseValue = validCaseValues.length > 0 
      ? validCaseValues.reduce((sum: number, val: number) => sum + val, 0) / validCaseValues.length 
      : 0

    return {
      case_type: caseType,
      total_cases: totalCases,
      settlement_rate: settledCases / totalCases,
      average_case_value: averageCaseValue,
      outcome_distribution: {
        settled: settledCases,
        dismissed: dismissedCases,
        judgment: judgmentCases,
        other: otherCases
      }
    }
  }).sort((a, b) => b.total_cases - a.total_cases)
}

function analyzeOutcomes(cases: any[]) {
  const outcomes = cases.reduce((acc, case_) => {
    const outcome = normalizeOutcome(case_.outcome || case_.status)
    acc[outcome] = (acc[outcome] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalCases = cases.length
  const settledCases = outcomes.settled || 0
  const dismissedCases = outcomes.dismissed || 0
  const judgmentCases = outcomes.judgment || 0

  // Calculate average case duration
  const casesWithDuration = cases
    .filter(c => c.filing_date && c.decision_date)
    .map(c => {
      const filing = new Date(c.filing_date)
      const decision = new Date(c.decision_date)
      return Math.abs(decision.getTime() - filing.getTime()) / (1000 * 60 * 60 * 24)
    })
  
  const averageCaseDuration = casesWithDuration.length > 0
    ? casesWithDuration.reduce((sum, duration) => sum + duration, 0) / casesWithDuration.length
    : 0

  // Analyze settlement rates by case value ranges
  const caseValueTrends = analyzeCaseValueTrends(cases)

  return {
    overall_settlement_rate: settledCases / totalCases,
    dismissal_rate: dismissedCases / totalCases,
    judgment_rate: judgmentCases / totalCases,
    average_case_duration: Math.round(averageCaseDuration),
    case_value_trends: caseValueTrends
  }
}

function analyzeCaseValueTrends(cases: any[]) {
  const casesWithValue = cases.filter(c => c.case_value && !isNaN(c.case_value))
  
  if (casesWithValue.length === 0) {
    return []
  }

  const ranges = [
    { range: '$0-$50k', min: 0, max: 50000 },
    { range: '$50k-$250k', min: 50000, max: 250000 },
    { range: '$250k-$1M', min: 250000, max: 1000000 },
    { range: '$1M+', min: 1000000, max: Infinity }
  ]

  return ranges.map(({ range, min, max }) => {
    const casesInRange = casesWithValue.filter(c => c.case_value >= min && c.case_value < max)
    const settledInRange = casesInRange.filter(c => 
      normalizeOutcome(c.outcome || c.status) === 'settled'
    ).length

    return {
      value_range: range,
      case_count: casesInRange.length,
      settlement_rate: casesInRange.length > 0 ? settledInRange / casesInRange.length : 0
    }
  }).filter(trend => trend.case_count > 0)
}

function analyzeTemporalPatterns(cases: any[]): TemporalPattern[] {
  const monthlyGroups = cases.reduce((groups, case_) => {
    if (!case_.decision_date) return groups
    
    const date = new Date(case_.decision_date)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const key = `${year}-${month}`
    
    if (!groups[key]) {
      groups[key] = { year, month, cases: [] }
    }
    groups[key].cases.push(case_)
    return groups
  }, {} as Record<string, { year: number, month: number, cases: any[] }>)

  return (Object.values(monthlyGroups) as { year: number, month: number, cases: any[] }[]).map(({ year, month, cases: monthCases }) => {
    const settledCases = monthCases.filter((c: any) => 
      normalizeOutcome(c.outcome || c.status) === 'settled'
    ).length

    // Calculate average duration for this month
    const casesWithDuration = monthCases
      .filter((c: any) => c.filing_date && c.decision_date)
      .map((c: any) => {
        const filing = new Date(c.filing_date)
        const decision = new Date(c.decision_date)
        return Math.abs(decision.getTime() - filing.getTime()) / (1000 * 60 * 60 * 24)
      })
    
    const averageDuration = casesWithDuration.length > 0
      ? casesWithDuration.reduce((sum: number, duration: number) => sum + duration, 0) / casesWithDuration.length
      : 0

    return {
      year,
      month,
      case_count: monthCases.length,
      settlement_rate: settledCases / monthCases.length,
      average_duration: Math.round(averageDuration)
    }
  }).sort((a: any, b: any) => (a.year - b.year) || (a.month - b.month)) as TemporalPattern[]
}

function calculateBiasIndicators(cases: any[], caseTypePatterns: CaseTypePattern[], outcomeAnalysis: any) {
  // Consistency Score: How consistent outcomes are within case types
  const consistencyScore = calculateConsistencyScore(caseTypePatterns)
  
  // Speed Score: How fast decisions are made compared to average
  const speedScore = calculateSpeedScore(cases)
  
  // Settlement Preference: Tendency toward settlements
  const settlementPreference = (outcomeAnalysis.overall_settlement_rate - 0.5) * 200 // -100 to 100
  
  // Risk Tolerance: Willingness to handle high-value cases
  const riskTolerance = calculateRiskTolerance(cases)
  
  // Predictability Score: How predictable outcomes are based on case type
  const predictabilityScore = calculatePredictabilityScore(caseTypePatterns)

  return {
    consistency_score: Math.round(consistencyScore),
    speed_score: Math.round(speedScore),
    settlement_preference: Math.round(settlementPreference),
    risk_tolerance: Math.round(riskTolerance),
    predictability_score: Math.round(predictabilityScore)
  }
}

function calculateConsistencyScore(caseTypePatterns: CaseTypePattern[]): number {
  if (caseTypePatterns.length === 0) return 0
  
  // Calculate variance in settlement rates across case types
  const settlementRates = caseTypePatterns.map(p => p.settlement_rate)
  const avgSettlementRate = settlementRates.reduce((sum, rate) => sum + rate, 0) / settlementRates.length
  
  const variance = settlementRates.reduce((sum, rate) => sum + Math.pow(rate - avgSettlementRate, 2), 0) / settlementRates.length
  
  // Convert variance to consistency score (lower variance = higher consistency)
  return Math.max(0, 100 - (variance * 400)) // Scale and invert
}

function calculateSpeedScore(cases: any[]): number {
  const casesWithDuration = cases
    .filter(c => c.filing_date && c.decision_date)
    .map(c => {
      const filing = new Date(c.filing_date)
      const decision = new Date(c.decision_date)
      return Math.abs(decision.getTime() - filing.getTime()) / (1000 * 60 * 60 * 24)
    })
  
  if (casesWithDuration.length === 0) return 50
  
  const avgDuration = casesWithDuration.reduce((sum, duration) => sum + duration, 0) / casesWithDuration.length
  
  // Assume 180 days is average, scale accordingly
  const speedScore = Math.max(0, Math.min(100, 100 - (avgDuration - 180) * 0.5))
  
  return speedScore
}

function calculateRiskTolerance(cases: any[]): number {
  const casesWithValue = cases.filter(c => c.case_value && !isNaN(c.case_value))
  
  if (casesWithValue.length === 0) return 50
  
  const avgCaseValue = casesWithValue.reduce((sum, c) => sum + c.case_value, 0) / casesWithValue.length
  const highValueCases = casesWithValue.filter(c => c.case_value > 500000).length
  
  // Higher average value and more high-value cases = higher risk tolerance
  const valueScore = Math.min(100, avgCaseValue / 10000) // Scale by 10k
  const highValueRatio = (highValueCases / casesWithValue.length) * 100
  
  return (valueScore * 0.7 + highValueRatio * 0.3)
}

function calculatePredictabilityScore(caseTypePatterns: CaseTypePattern[]): number {
  if (caseTypePatterns.length === 0) return 0
  
  // Predictability based on how often the most common outcome occurs within each case type
  const predictabilityScores = caseTypePatterns.map(pattern => {
    const outcomes = pattern.outcome_distribution
    const totalCases = pattern.total_cases
    const maxOutcomeCount = Math.max(outcomes.settled, outcomes.dismissed, outcomes.judgment, outcomes.other)
    
    return totalCases > 0 ? (maxOutcomeCount / totalCases) * 100 : 0
  })
  
  return predictabilityScores.reduce((sum, score) => sum + score, 0) / predictabilityScores.length
}

function normalizeOutcome(outcome: string): string {
  if (!outcome) return 'other'
  
  const outcomeStr = outcome.toLowerCase()
  
  if (outcomeStr.includes('settl') || outcomeStr.includes('agreement')) return 'settled'
  if (outcomeStr.includes('dismiss') || outcomeStr.includes('withdraw')) return 'dismissed'
  if (outcomeStr.includes('judgment') || outcomeStr.includes('ruling') || outcomeStr.includes('verdict')) return 'judgment'
  
  return 'other'
}