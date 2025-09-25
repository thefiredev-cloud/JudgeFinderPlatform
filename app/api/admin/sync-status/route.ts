import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiAccess } from '@/lib/security/api-auth'
import { buildRateLimiter, getClientIp } from '@/lib/security/rate-limit'
import { SyncStatusService } from '@/lib/admin/sync-status-service'
import { SyncQueueManager, type SyncJobType } from '@/lib/sync/queue-manager'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminApiAccess(request, ['SYNC_API_KEY', 'CRON_SECRET'])
    await enforceRateLimit(request, 'api:admin:sync-status:get', 120)

    const service = SyncStatusService.initialize()
    const snapshot = await service.buildSnapshot()

    return NextResponse.json(snapshot)
  } catch (error) {
    logger.error('Failed to get sync status', { error })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get sync status',
        message: extractMessage(error),
        timestamp: new Date().toISOString(),
      },
      { status: statusCodeFor(error) }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminApiAccess(request, ['SYNC_API_KEY'])
    await enforceRateLimit(request, 'api:admin:sync-status:post', 60)

    const queueManager = new SyncQueueManager()
    const body = await request.json().catch(() => ({})) as { action?: string; type?: SyncJobType; options?: Record<string, unknown>; priority?: number; days?: number }

    switch (body.action) {
      case 'queue_job': {
        const jobId = await queueManager.addJob(
          body.type ?? 'decision',
          body.options || {},
          body.priority ?? 100
        )
        return NextResponse.json({ success: true, message: 'Job queued successfully', jobId, timestamp: new Date().toISOString() })
      }
      case 'cancel_jobs': {
        const cancelledCount = await queueManager.cancelJobs(body.type)
        return NextResponse.json({ success: true, message: `${cancelledCount} jobs cancelled`, cancelledCount, timestamp: new Date().toISOString() })
      }
      case 'cleanup': {
        const deletedCount = await queueManager.cleanupOldJobs(body.days ?? 7)
        return NextResponse.json({ success: true, message: `${deletedCount} old jobs cleaned up`, deletedCount, timestamp: new Date().toISOString() })
      }
      case 'restart_queue': {
        queueManager.stopProcessing()
        queueManager.startProcessing()
        return NextResponse.json({ success: true, message: 'Queue processing restarted', timestamp: new Date().toISOString() })
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    logger.error('Failed to execute admin sync action', { error })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute admin action',
        message: extractMessage(error),
        timestamp: new Date().toISOString(),
      },
      { status: statusCodeFor(error) }
    )
  }
}

async function enforceRateLimit(request: NextRequest, prefix: string, tokens: number): Promise<void> {
  const rateLimiter = buildRateLimiter({ tokens, window: '1 m', prefix })
  const { success } = await rateLimiter.limit(`${getClientIp(request)}:admin`)
  if (!success) {
    throw new RateLimitError()
  }
}

function extractMessage(error: unknown): string {
  if (error instanceof RateLimitError) {
    return 'Rate limit exceeded'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Unknown error'
}

function statusCodeFor(error: unknown): number {
  if (error instanceof RateLimitError) {
    return 429
  }
  if (error instanceof Error && error.message === 'Forbidden') {
    return 403
  }
  return 500
}

class RateLimitError extends Error {
  constructor() {
    super('Rate limit exceeded')
  }
}