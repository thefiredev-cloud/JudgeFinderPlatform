import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClerkSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClerkSupabaseServerClient()
    
    // Get user's bookmarked judges with judge details
    const { data, error } = await supabase
      .from('user_bookmarks')
      .select(`
        id,
        judge_id,
        created_at,
        judges (
          id,
          name,
          court,
          jurisdiction,
          slug
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 })
    }

    return NextResponse.json({ bookmarks: data || [] })
  } catch (error) {
    console.error('Bookmarks API error:', error)
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

    const { judge_id } = await request.json()

    if (!judge_id) {
      return NextResponse.json({ error: 'Judge ID is required' }, { status: 400 })
    }

    const supabase = await createClerkSupabaseServerClient()

    // Check if already bookmarked
    const { data: existing } = await supabase
      .from('user_bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('judge_id', judge_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Judge already bookmarked' }, { status: 409 })
    }

    // Add bookmark
    const { data, error } = await supabase
      .from('user_bookmarks')
      .insert({
        user_id: userId,
        judge_id: judge_id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to bookmark judge' }, { status: 500 })
    }

    return NextResponse.json({ bookmark: data }, { status: 201 })
  } catch (error) {
    console.error('Bookmark creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { judge_id } = await request.json()

    if (!judge_id) {
      return NextResponse.json({ error: 'Judge ID is required' }, { status: 400 })
    }

    const supabase = await createClerkSupabaseServerClient()

    const { error } = await supabase
      .from('user_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('judge_id', judge_id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bookmark deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}