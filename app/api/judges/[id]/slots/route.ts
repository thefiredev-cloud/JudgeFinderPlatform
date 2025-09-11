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
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('attorney_slots')
      .select('id, judge_id, attorney_id, position, start_date, end_date, price_per_month, is_active')
      .eq('judge_id', judgeId)
      .order('position', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to load slots' }, { status: 500 })
    }

    return NextResponse.json({ slots: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}


