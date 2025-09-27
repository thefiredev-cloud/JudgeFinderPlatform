import { NextRequest, NextResponse } from 'next/server'
import { SyncQueueManager } from '@/lib/sync/queue-manager'
import { requireApiKey } from '@/lib/security/api-auth'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300 // process a single job within Vercel hobby limits

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const auth = requireApiKey(request, { allow: ['CRON_SECRET'] })
    if ('ok' in auth === false) {
      return auth
    }

    const queueManager = new SyncQueueManager()
    const job = await queueManager.getNextJob()

    if (!job) {
      logger.debug?.('Queue worker run found no jobs')
      return NextResponse.json({
        success: true,
        queued: false,
        message: 'No sync jobs pending'
      }, { status: 200 })
    }

    logger.info('Queue worker processing job', {
      jobId: job.id,
      type: job.type,
      options: job.options
    })

    await queueManager.processJob(job)

    const duration = Date.now() - startTime

    logger.info('Queue worker completed job', {
      jobId: job.id,
      type: job.type,
      duration
    })

    return NextResponse.json({
      success: true,
      processed: true,
      jobId: job.id,
      type: job.type,
      duration
    })

  } catch (error) {
    const duration = Date.now() - startTime

    logger.error('Queue worker failed to process job', { error, duration })

    return NextResponse.json({
      success: false,
      error: 'Queue processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration
    }, { status: 500 })
  }
}

