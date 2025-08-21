import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Clerk
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerClient()
    const userId = user.id

    // Get user activity stats
    const { data: activityStats, error: activityError } = await supabase
      .from('user_activity')
      .select('activity_type, created_at')
      .eq('user_id', userId)

    if (activityError) {
      console.error('Activity query error:', activityError)
    }

    // Get bookmark count
    const { count: bookmarkCount, error: bookmarkError } = await supabase
      .from('user_bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (bookmarkError) {
      console.error('Bookmark query error:', bookmarkError)
    }

    // Process activity data
    const activities = activityStats || []
    const totalSearches = activities.filter(a => a.activity_type === 'search').length
    const judgesViewed = activities.filter(a => a.activity_type === 'view').length
    const comparisonsRun = activities.filter(a => a.activity_type === 'compare').length

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentActivity = activities.filter(a => 
      new Date(a.created_at) > thirtyDaysAgo
    ).length

    // Calculate join date
    const joinDate = user.createdAt ? new Date(user.createdAt) : new Date()
    const daysSinceJoin = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24))

    const stats = {
      totalSearches,
      judgesViewed,
      bookmarkedJudges: bookmarkCount || 0,
      comparisonsRun,
      recentActivity,
      daysSinceJoin,
      memberSince: joinDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const response = NextResponse.json({
      success: true,
      stats,
      message: 'User stats retrieved successfully'
    })

    // Cache for 5 minutes
    response.headers.set(
      'Cache-Control',
      'private, s-maxage=300, stale-while-revalidate=60'
    )

    return response

  } catch (error) {
    console.error('User stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}