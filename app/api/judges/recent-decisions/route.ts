import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface YearlyDecisionCount {
  year: number
  count: number
}

interface JudgeDecisionSummary {
  judge_id: string
  yearly_counts: YearlyDecisionCount[]
  total_recent: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const judgeIdsParam = searchParams.get('judge_ids')
    const yearsParam = searchParams.get('years') || '3' // Default to last 3 years

    if (!judgeIdsParam) {
      return NextResponse.json({ error: 'judge_ids parameter required' }, { status: 400 })
    }

    const judgeIds = judgeIdsParam.split(',').filter(id => id.trim())
    const yearsBack = Math.min(Math.max(parseInt(yearsParam, 10) || 3, 1), 10)
    
    if (judgeIds.length === 0) {
      return NextResponse.json({ decision_summaries: [] })
    }

    const supabase = await createServerClient()
    const currentYear = new Date().getFullYear()
    const startYear = currentYear - yearsBack + 1

    // Query to get decision counts by judge and year
    const { data, error } = await supabase
      .from('cases')
      .select('judge_id, decision_date')
      .in('judge_id', judgeIds)
      .not('decision_date', 'is', null)
      .gte('decision_date', `${startYear}-01-01`)
      .lte('decision_date', `${currentYear}-12-31`)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch decision data' }, { status: 500 })
    }

    // Process data to create yearly summaries
    const decisionsByJudge = new Map<string, Map<number, number>>()

    // Initialize maps for all requested judges
    judgeIds.forEach(judgeId => {
      const yearMap = new Map<number, number>()
      for (let year = startYear; year <= currentYear; year++) {
        yearMap.set(year, 0)
      }
      decisionsByJudge.set(judgeId, yearMap)
    })

    // Count decisions by judge and year
    data?.forEach(case_record => {
      if (!case_record.decision_date) return
      
      const year = new Date(case_record.decision_date).getFullYear()
      const judgeMap = decisionsByJudge.get(case_record.judge_id)
      
      if (judgeMap && year >= startYear && year <= currentYear) {
        judgeMap.set(year, (judgeMap.get(year) || 0) + 1)
      }
    })

    // Convert to response format
    const decision_summaries: JudgeDecisionSummary[] = []

    decisionsByJudge.forEach((yearMap, judgeId) => {
      const yearly_counts: YearlyDecisionCount[] = []
      let total_recent = 0

      for (let year = currentYear; year >= startYear; year--) {
        const count = yearMap.get(year) || 0
        yearly_counts.push({ year, count })
        total_recent += count
      }

      decision_summaries.push({
        judge_id: judgeId,
        yearly_counts,
        total_recent
      })
    })

    return NextResponse.json({ decision_summaries })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 })
  }
}