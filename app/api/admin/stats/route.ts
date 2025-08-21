import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/auth/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId || !(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServiceRoleClient()

    // Get judges count
    const { count: judgesCount, error: judgesError } = await supabase
      .from('judges')
      .select('*', { count: 'exact', head: true })

    if (judgesError) {
      console.error('Error fetching judges count:', judgesError)
      return NextResponse.json({ error: 'Failed to fetch judges count' }, { status: 500 })
    }

    // Get courts count
    const { count: courtsCount, error: courtsError } = await supabase
      .from('courts')
      .select('*', { count: 'exact', head: true })

    if (courtsError) {
      console.error('Error fetching courts count:', courtsError)
      return NextResponse.json({ error: 'Failed to fetch courts count' }, { status: 500 })
    }

    // Get users count (from user_preferences as proxy for active users)
    const { count: usersCount, error: usersError } = await supabase
      .from('user_preferences')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      console.error('Error fetching users count:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users count' }, { status: 500 })
    }

    // Calculate system health based on data completeness
    let systemHealth: 'healthy' | 'warning' | 'error' = 'healthy'
    
    if ((judgesCount || 0) < 1000) {
      systemHealth = 'warning'
    }
    if ((judgesCount || 0) < 500) {
      systemHealth = 'error'
    }

    // Get last sync time (mock for now)
    const lastSyncTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago

    return NextResponse.json({
      totalJudges: judgesCount || 0,
      totalCourts: courtsCount || 0,
      totalUsers: usersCount || 0,
      pendingSync: 0,
      lastSyncTime,
      systemHealth,
      activeUsers: Math.floor((usersCount || 0) * 0.3), // Estimate 30% active
      searchVolume: Math.floor(Math.random() * 1000) + 500 // Mock search volume
    })

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}