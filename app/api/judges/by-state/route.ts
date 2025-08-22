import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { Judge } from '@/types'

export const dynamic = 'force-dynamic'

interface JudgesByState {
  [state: string]: {
    count: number
    judges: Judge[]
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeJudges = searchParams.get('include_judges') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10') // limit judges per state
    const minJudges = parseInt(searchParams.get('min_judges') || '1') // minimum judges to include state

    const supabase = await createServerClient()

    if (!includeJudges) {
      // Just return state counts
      const { data, error } = await supabase
        .from('judges')
        .select('jurisdiction')
        .not('jurisdiction', 'is', null)
        .not('jurisdiction', 'eq', '')
        .not('jurisdiction', 'eq', 'Unknown')

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch judge counts by state' }, 
          { status: 500 }
        )
      }

      // Count judges by state
      const stateCounts: { [key: string]: number } = {}
      data?.forEach(judge => {
        const state = judge.jurisdiction?.trim()
        if (state && state !== 'Unknown') {
          stateCounts[state] = (stateCounts[state] || 0) + 1
        }
      })

      // Filter by minimum judges and sort
      const filteredStates = Object.entries(stateCounts)
        .filter(([_, count]) => count >= minJudges)
        .sort(([a], [b]) => a.localeCompare(b))
        .reduce((acc, [state, count]) => {
          acc[state] = { count, judges: [] }
          return acc
        }, {} as JudgesByState)

      const response = NextResponse.json({
        states: filteredStates,
        total_states: Object.keys(filteredStates).length,
        total_judges: Object.values(stateCounts).reduce((sum, count) => sum + count, 0)
      })

      response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300')
      return response
    }

    // Get judges with full details organized by state
    const { data: judges, error } = await supabase
      .from('judges')
      .select('id, name, court_name, jurisdiction, total_cases, profile_image_url')
      .not('jurisdiction', 'is', null)
      .not('jurisdiction', 'eq', '')
      .not('jurisdiction', 'eq', 'Unknown')
      .order('jurisdiction')
      .order('name')

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch judges by state' }, 
        { status: 500 }
      )
    }

    // Group judges by state
    const judgesByState: JudgesByState = {}
    
    judges?.forEach(judge => {
      const state = judge.jurisdiction?.trim()
      if (state && state !== 'Unknown') {
        if (!judgesByState[state]) {
          judgesByState[state] = { count: 0, judges: [] }
        }
        
        // Only add up to the limit per state
        if (judgesByState[state].judges.length < limit) {
          judgesByState[state].judges.push(judge as Judge)
        }
        judgesByState[state].count++
      }
    })

    // Filter by minimum judges and sort
    const filteredStates = Object.entries(judgesByState)
      .filter(([_, data]) => data.count >= minJudges)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce((acc, [state, data]) => {
        acc[state] = data
        return acc
      }, {} as JudgesByState)

    const totalJudges = Object.values(filteredStates).reduce((sum, data) => sum + data.count, 0)

    const result = {
      states: filteredStates,
      total_states: Object.keys(filteredStates).length,
      total_judges: totalJudges,
      per_state_limit: limit,
      min_judges_filter: minJudges
    }

    const response = NextResponse.json(result)
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300')
    
    return response

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
