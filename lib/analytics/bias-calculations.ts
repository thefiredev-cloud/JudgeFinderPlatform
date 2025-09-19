export interface CaseRecord {
  case_type?: string | null
  outcome?: string | null
  status?: string | null
  case_value?: number | null
  filing_date?: string | null
  decision_date?: string | null
}

export interface CaseTypePattern {
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

export interface OutcomeAnalysis {
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

export interface TemporalPattern {
  year: number
  month: number
  case_count: number
  settlement_rate: number
  average_duration: number
}

export interface BiasIndicators {
  consistency_score: number
  speed_score: number
  settlement_preference: number
  risk_tolerance: number
  predictability_score: number
}

export interface BiasMetrics {
  case_type_patterns: CaseTypePattern[]
  outcome_analysis: OutcomeAnalysis
  temporal_patterns: TemporalPattern[]
  bias_indicators: BiasIndicators
}

function normalizeOutcome(value: string | null | undefined): 'settled' | 'dismissed' | 'judgment' | 'other' {
  if (!value) return 'other'
  const outcome = value.toLowerCase()

  if (outcome.includes('settled') || outcome.includes('compromise')) {
    return 'settled'
  }
  if (outcome.includes('dismiss')) {
    return 'dismissed'
  }
  if (outcome.includes('judgment') || outcome.includes('granted')) {
    return 'judgment'
  }
  return 'other'
}

export function analyzeCaseTypePatterns(cases: CaseRecord[]): CaseTypePattern[] {
  const caseTypeGroups = cases.reduce((groups, case_) => {
    const caseType = case_.case_type || 'Other'
    if (!groups[caseType]) {
      groups[caseType] = []
    }
    groups[caseType].push(case_)
    return groups
  }, {} as Record<string, CaseRecord[]>)

  return Object.entries(caseTypeGroups)
    .map(([caseType, casesInType]) => {
      const outcomes = casesInType.reduce((acc: Record<string, number>, case_) => {
        const outcome = normalizeOutcome(case_.outcome || case_.status)
        acc[outcome] = (acc[outcome] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const totalCases = casesInType.length
      const settledCases = outcomes.settled || 0
      const dismissedCases = outcomes.dismissed || 0
      const judgmentCases = outcomes.judgment || 0
      const otherCases = totalCases - settledCases - dismissedCases - judgmentCases

      const validCaseValues = casesInType
        .map((c) => c.case_value)
        .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v))

      const averageCaseValue = validCaseValues.length > 0
        ? validCaseValues.reduce((sum, val) => sum + val, 0) / validCaseValues.length
        : 0

      return {
        case_type: caseType,
        total_cases: totalCases,
        settlement_rate: totalCases > 0 ? settledCases / totalCases : 0,
        average_case_value: averageCaseValue,
        outcome_distribution: {
          settled: settledCases,
          dismissed: dismissedCases,
          judgment: judgmentCases,
          other: otherCases,
        },
      }
    })
    .sort((a, b) => b.total_cases - a.total_cases)
}

export function analyzeOutcomes(cases: CaseRecord[]): OutcomeAnalysis {
  const outcomes = cases.reduce((acc, case_) => {
    const outcome = normalizeOutcome(case_.outcome || case_.status)
    acc[outcome] = (acc[outcome] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalCases = cases.length
  const settledCases = outcomes.settled || 0
  const dismissedCases = outcomes.dismissed || 0
  const judgmentCases = outcomes.judgment || 0

  const casesWithDuration = cases
    .filter((c) => c.filing_date && c.decision_date)
    .map((c) => {
      const filing = new Date(c.filing_date as string)
      const decision = new Date(c.decision_date as string)
      return Math.abs(decision.getTime() - filing.getTime()) / (1000 * 60 * 60 * 24)
    })

  const averageCaseDuration = casesWithDuration.length > 0
    ? casesWithDuration.reduce((sum, duration) => sum + duration, 0) / casesWithDuration.length
    : 0

  const caseValueTrends = [
    { value_range: '< $10K', min: 0, max: 10000 },
    { value_range: '$10K - $50K', min: 10000, max: 50000 },
    { value_range: '$50K - $250K', min: 50000, max: 250000 },
    { value_range: '$250K+', min: 250000, max: Number.POSITIVE_INFINITY },
  ].map((range) => {
    const casesInRange = cases.filter((c) => {
      const value = c.case_value
      if (!value || Number.isNaN(value)) return false
      return value >= range.min && value < range.max
    })

    const settledInRange = casesInRange.filter((c) => normalizeOutcome(c.outcome || c.status) === 'settled').length

    return {
      value_range: range.value_range,
      case_count: casesInRange.length,
      settlement_rate: casesInRange.length > 0 ? settledInRange / casesInRange.length : 0,
    }
  })

  return {
    overall_settlement_rate: totalCases > 0 ? settledCases / totalCases : 0,
    dismissal_rate: totalCases > 0 ? dismissedCases / totalCases : 0,
    judgment_rate: totalCases > 0 ? judgmentCases / totalCases : 0,
    average_case_duration: averageCaseDuration,
    case_value_trends: caseValueTrends,
  }
}

export function analyzeTemporalPatterns(cases: CaseRecord[]): TemporalPattern[] {
  const temporalGroups = cases.reduce((groups, case_) => {
    if (!case_.decision_date) return groups
    const decisionDate = new Date(case_.decision_date)
    if (Number.isNaN(decisionDate.getTime())) return groups

    const key = `${decisionDate.getFullYear()}-${String(decisionDate.getMonth() + 1).padStart(2, '0')}`
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(case_)
    return groups
  }, {} as Record<string, CaseRecord[]>)

  return Object.entries(temporalGroups)
    .map(([key, groupCases]) => {
      const [year, month] = key.split('-')
      const caseCounts = groupCases.length
      const settlementCount = groupCases.filter((c) => normalizeOutcome(c.outcome || c.status) === 'settled').length

      const durations = groupCases
        .filter((c) => c.filing_date)
        .map((c) => {
          const filing = new Date(c.filing_date as string)
          const decision = c.decision_date ? new Date(c.decision_date) : null
          if (!decision || Number.isNaN(decision.getTime()) || Number.isNaN(filing.getTime())) {
            return null
          }
          return Math.abs(decision.getTime() - filing.getTime()) / (1000 * 60 * 60 * 24)
        })
        .filter((val): val is number => typeof val === 'number')

      const averageDuration = durations.length > 0
        ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
        : 0

      return {
        year: Number(year),
        month: Number(month),
        case_count: caseCounts,
        settlement_rate: caseCounts > 0 ? settlementCount / caseCounts : 0,
        average_duration: averageDuration,
      }
    })
    .sort((a, b) => {
      if (a.year === b.year) {
        return a.month - b.month
      }
      return a.year - b.year
    })
}

export function calculateBiasIndicators(
  cases: CaseRecord[],
  caseTypePatterns: CaseTypePattern[],
  outcomeAnalysis: OutcomeAnalysis,
): BiasIndicators {
  const totalCases = cases.length || 1
  const totalCaseTypes = caseTypePatterns.length || 1

  const settlementRates = caseTypePatterns.map((pattern) => pattern.settlement_rate)
  const variance = settlementRates.reduce((sum, rate) => sum + Math.pow(rate - outcomeAnalysis.overall_settlement_rate, 2), 0)
    / settlementRates.length || 1

  const consistencyScore = Math.max(0, Math.min(100, 100 - variance * 100))
  const speedScore = Math.max(0, Math.min(100, 100 - (outcomeAnalysis.average_case_duration / 180) * 100))

  const settlementPreference = (outcomeAnalysis.overall_settlement_rate - 0.5) * 100
  const riskTolerance = Math.max(0, Math.min(100, (caseTypePatterns.filter((pattern) => pattern.average_case_value > 100000).length / totalCaseTypes) * 100))

  const predictabilityScore = Math.max(0, Math.min(100, (totalCases >= 50 ? consistencyScore : consistencyScore * 0.8)))

  return {
    consistency_score: Number(consistencyScore.toFixed(1)),
    speed_score: Number(speedScore.toFixed(1)),
    settlement_preference: Number(settlementPreference.toFixed(1)),
    risk_tolerance: Number(riskTolerance.toFixed(1)),
    predictability_score: Number(predictabilityScore.toFixed(1)),
  }
}
