import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClerkSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const type = url.searchParams.get('type') // 'search', 'view', 'bookmark'

    const supabase = await createClerkSupabaseServerClient()
    
    let query = supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (type) {
      query = query.eq('activity_type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
    }

    return NextResponse.json({ activity: data || [] })
  } catch (error) {
    console.error('Activity API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { activity_type, activity_data, judge_id, search_query } = await request.json()

    if (!activity_type) {
      return NextResponse.json({ error: 'Activity type is required' }, { status: 400 })
    }

    const supabase = await createClerkSupabaseServerClient()

    const { data, error } = await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        activity_type,
        activity_data,
        judge_id,
        search_query
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 })
    }

    return NextResponse.json({ activity: data }, { status: 201 })
  } catch (error) {
    console.error('Activity logging error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}