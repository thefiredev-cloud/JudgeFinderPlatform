import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/is-admin'
import { AdminStatsService } from '@/lib/admin/stats-service'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  try {
    await ensureAdminAccess()
    const service = await AdminStatsService.initialize()
    const snapshot = await service.buildSnapshot()

    return NextResponse.json({
      totalJudges: snapshot.totals.judges,
      totalCourts: snapshot.totals.courts,
      totalCases: snapshot.totals.cases,
      totalUsers: snapshot.totals.users,
      pendingSync: snapshot.pendingSync,
      lastSyncTime: snapshot.syncHealth.lastCompletedAt,
      systemHealth: snapshot.systemHealth,
      activeUsers: snapshot.activeUsersEstimate,
      searchVolume: snapshot.cacheMetrics.lookupVolume,
      syncSuccessRate: snapshot.syncHealth.successRate,
      retryCount: snapshot.syncHealth.retryCount,
      cacheHitRatio: snapshot.cacheMetrics.cacheHitRatio,
      latencyP50: snapshot.cacheMetrics.latencyP50,
      latencyP95: snapshot.cacheMetrics.latencyP95,
    })
  } catch (error) {
    return NextResponse.json({ error: extractMessage(error) }, { status: 500 })
  }
}

async function ensureAdminAccess(): Promise<void> {
  const { userId } = await auth()
  if (!userId || !(await isAdmin())) {
    throw new Error('Forbidden')
  }
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Internal server error'
}
