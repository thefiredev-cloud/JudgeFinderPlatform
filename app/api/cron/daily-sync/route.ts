import { NextRequest, NextResponse } from 'next/server'
import { SyncQueueManager } from '@/lib/sync/queue-manager'
import { logger } from '@/lib/utils/logger'
import { requireApiKey } from '@/lib/security/api-auth'
import { buildRateLimiter, getClientIp } from '@/lib/security/rate-limit'
import { logCronMetric } from '@/lib/sync/cron-logger'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'
export const maxDuration = 60 // 1 minute to queue jobs, actual processing happens async

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const rateLimiter = buildRateLimiter({ tokens: 5, window: '1 m', prefix: 'cron:daily:get' })
  const ipAddress = getClientIp(request)

  try {
    const auth = requireApiKey(request, { allow: ['CRON_SECRET'] })
    if ('ok' in auth === false) {
      return auth
    }

    const rateLimitCheck = await rateLimiter.limit(ipAddress)
    if (!rateLimitCheck.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    logger.info('Starting daily sync cron job')

    const queueManager = new SyncQueueManager()

    // Queue daily decision sync (highest priority)
    const decisionJobId = await queueManager.addJob(
      'decision',
      {
        batchSize: 5,
        jurisdiction: 'CA',
        daysSinceLast: 1, // Only fetch decisions from last day
        maxDecisionsPerJudge: 20 // Limit for daily sync
      },
      100 // High priority
    )

    // Queue judge profile updates (lower priority)
    const judgeJobId = await queueManager.addJob(
      'judge',
      {
        batchSize: 20,
        jurisdiction: 'CA',
        forceRefresh: false // Only update stale profiles
      },
      50 // Medium priority
    )

    const duration = Date.now() - startTime

    logger.info('Daily sync jobs queued successfully', {
      decisionJobId,
      judgeJobId,
      duration
    })

    const jobs = [
      {
        id: decisionJobId,
        type: 'decision',
        description: 'Sync recent decisions from last 24 hours'
      },
      {
        id: judgeJobId,
        type: 'judge',
        description: 'Update stale judge profiles'
      }
    ]

    await logCronMetric({
      route: '/api/cron/daily-sync',
      metricName: 'cron_daily_sync',
      status: 'success',
      startTime,
      durationMs: duration,
      jobsQueued: jobs.length,
      ipAddress
    })

    return NextResponse.json({
      success: true,
      message: 'Daily sync jobs queued successfully',
      jobs,
      queuedAt: new Date().toISOString(),
      duration
    })

  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.error('Daily sync cron job failed', { error, duration })

    await logCronMetric({
      route: '/api/cron/daily-sync',
      metricName: 'cron_daily_sync',
      status: 'error',
      startTime,
      durationMs: duration,
      jobsQueued: 0,
      ipAddress
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to queue daily sync jobs',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Health check endpoint
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const ipAddress = getClientIp(request)
  const rateLimiter = buildRateLimiter({ tokens: 10, window: '1 m', prefix: 'cron:daily:post' })

  try {
    const auth = requireApiKey(request, { allow: ['SYNC_API_KEY', 'CRON_SECRET'] })
    if ('ok' in auth === false) return auth

    const limitCheck = await rateLimiter.limit(ipAddress)
    if (!limitCheck.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    // Get manual sync options from request body
    const body = await request.json().catch(() => ({}))
    const force = body.force || false

    logger.info('Manual daily sync triggered', { force })

    const queueManager = new SyncQueueManager()

    // Queue jobs with higher priority for manual trigger
    const jobs = []

    // Decision sync
    const decisionJobId = await queueManager.addJob(
      'decision',
      {
        batchSize: body.batchSize || 10,
        jurisdiction: 'CA',
        daysSinceLast: force ? 7 : 1, // More days if forced
        maxDecisionsPerJudge: force ? 50 : 20
      },
      150 // Higher priority for manual
    )
    jobs.push({ id: decisionJobId, type: 'decision' })

    // Judge sync if forced
    if (force) {
      const judgeJobId = await queueManager.addJob(
        'judge',
        {
          batchSize: 20,
          jurisdiction: 'CA',
          forceRefresh: true
        },
        100
      )
      jobs.push({ id: judgeJobId, type: 'judge' })
    }

    const duration = Date.now() - startTime

    await logCronMetric({
      route: '/api/cron/daily-sync',
      metricName: 'cron_daily_sync_manual',
      status: 'success',
      startTime,
      durationMs: duration,
      jobsQueued: jobs.length,
      ipAddress
    })

    return NextResponse.json({
      success: true,
      message: 'Manual daily sync jobs queued',
      jobs,
      triggeredAt: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Manual daily sync failed', { error })
    const duration = Date.now() - startTime

    await logCronMetric({
      route: '/api/cron/daily-sync',
      metricName: 'cron_daily_sync_manual',
      status: 'error',
      startTime,
      durationMs: duration,
      jobsQueued: 0,
      ipAddress
    })
    
    return NextResponse.json({
      success: false,
      error: 'Failed to trigger manual sync',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
