import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  analyzeCaseTypePatterns,
  analyzeOutcomes,
  analyzeTemporalPatterns,
  calculateBiasIndicators,
  type BiasMetrics,
  type CaseRecord,
} from '@/lib/analytics/bias-calculations'
import { getCourtBaseline } from '@/lib/analytics/baselines'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

interface BiasAnalysisParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: BiasAnalysisParams) {
  try {
    const resolvedParams = await params
    const supabase = await createServerClient()
    const judgeId = resolvedParams.id

    const { data: judge, error: judgeError } = await supabase
      .from('judges')
      .select('id, name, court_id')
      .eq('id', judgeId)
      .single()

    if (judgeError || !judge) {
      return NextResponse.json({ error: 'Judge not found' }, { status: 404 })
    }

    const { data: caseRows, error: casesError } = await supabase
      .from('cases')
      .select('case_type, outcome, status, case_value, filing_date, decision_date')
      .eq('judge_id', judgeId)
      .not('decision_date', 'is', null)

    if (casesError) {
      return NextResponse.json({ error: 'Failed to fetch case data' }, { status: 500 })
    }

    if (!caseRows || caseRows.length === 0) {
      return NextResponse.json({ error: 'No case data available for bias analysis' }, { status: 404 })
    }

    const caseRecords = caseRows as CaseRecord[]

    const caseTypePatterns = analyzeCaseTypePatterns(caseRecords)
    const outcomeAnalysis = analyzeOutcomes(caseRecords)
    const temporalPatterns = analyzeTemporalPatterns(caseRecords)
    const biasIndicators = calculateBiasIndicators(caseRecords, caseTypePatterns, outcomeAnalysis)

    const biasMetrics: BiasMetrics = {
      case_type_patterns: caseTypePatterns,
      outcome_analysis: outcomeAnalysis,
      temporal_patterns: temporalPatterns,
      bias_indicators: biasIndicators,
    }

    const courtBaseline = judge.court_id ? await getCourtBaseline(judge.court_id) : null

    return NextResponse.json(
      {
        ...biasMetrics,
        court_baseline: courtBaseline,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, max-age=900, stale-while-revalidate=900',
        },
      },
    )
  } catch (error) {
    console.error('Error generating bias analysis:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
