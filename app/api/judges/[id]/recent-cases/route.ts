import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const judgeId = resolvedParams.id
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = Math.min(Math.max(parseInt(limitParam || '10', 10) || 10, 1), 200)

    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('cases')
      .select('id, case_name, case_number, filing_date, decision_date, case_type, outcome, summary, status, courtlistener_id, source_url')
      .eq('judge_id', judgeId)
      .order('decision_date', { ascending: false, nullsFirst: false })
      .order('filing_date', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: 'Failed to load cases' }, { status: 500 })
    }

    return NextResponse.json({ cases: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

