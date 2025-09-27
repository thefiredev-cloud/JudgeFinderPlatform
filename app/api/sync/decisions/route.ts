import { NextRequest, NextResponse } from 'next/server'
import { SyncQueueManager } from '@/lib/sync/queue-manager'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export const revalidate = 0

export const runtime = 'nodejs'
export const maxDuration = 60 // enqueue job quickly; processing handled by queue worker

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { requireApiKey } = await import('@/lib/security/api-auth')
    const auth = requireApiKey(request, { allow: ['SYNC_API_KEY'] })
    if ('ok' in auth === false) return auth

    // Parse request options
    const body = await request.json().catch(() => ({}))
    const options = {
      batchSize: body.batchSize || 5,
      jurisdiction: body.jurisdiction || 'CA',
      daysSinceLast: body.daysSinceLast || undefined,
      judgeIds: body.judgeIds || undefined,
      maxDecisionsPerJudge: body.maxDecisionsPerJudge || 50,
      ...body
    }

    logger.info('Starting decision sync via API', { 
      options: {
        ...options,
        judgeIds: options.judgeIds ? `${options.judgeIds.length} judges` : undefined
      }
    })

    const queueManager = new SyncQueueManager()
    const jobId = await queueManager.addJob('decision', options, 100)

    const duration = Date.now() - startTime

    logger.info('Decision sync job queued via API', {
      jobId,
      duration
    })

    return NextResponse.json({
      success: true,
      queued: true,
      jobId,
      options,
      duration
    }, {
      status: 202
    })

  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.error('Decision sync API failed', { error, duration })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to queue decision sync',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return sync status/info
    return NextResponse.json({
      endpoint: 'decisions',
      methods: ['POST'],
      description: 'Synchronize judicial decisions from CourtListener API',
      options: {
        batchSize: 'Number of judges to process in each batch (default: 5)',
        jurisdiction: 'Filter by jurisdiction (default: CA)',
        daysSinceLast: 'Fetch decisions from X days ago (overrides automatic detection)',
        judgeIds: 'Array of specific judge IDs to sync decisions for (optional)',
        maxDecisionsPerJudge: 'Maximum new decisions to fetch per judge (default: 50)',
        includeDockets: 'Set to false to skip docket (court filing) ingestion',
        maxFilingsPerJudge: 'Maximum number of docket filings to fetch per judge (default: 300)',
        filingYearsBack: 'How many years back to request docket filings when none exist yet (default: matches yearsBack)'
      },
      example: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'your-sync-api-key'
        },
        body: {
          batchSize: 5,
          jurisdiction: 'CA',
          daysSinceLast: 7,
          maxDecisionsPerJudge: 50,
          maxFilingsPerJudge: 150,
          judgeIds: ['judge-id-1', 'judge-id-2']
        }
      },
      notes: [
        'This endpoint has stricter rate limiting due to CourtListener API constraints',
        'Processing time may be longer for large datasets',
        'Duplicate decisions and docket filings are automatically skipped based on CourtListener IDs'
      ]
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get sync info' },
      { status: 500 }
    )
  }
}
