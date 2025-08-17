import { NextRequest, NextResponse } from 'next/server'
import { DecisionSyncManager } from '@/lib/sync/decision-sync'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'
export const maxDuration = 600 // 10 minutes for decision sync (longer due to rate limits)

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify API key for security
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

    // Initialize sync manager and run sync
    const syncManager = new DecisionSyncManager()
    const result = await syncManager.syncDecisions(options)

    const duration = Date.now() - startTime

    logger.info('Decision sync API completed', { 
      result: {
        ...result,
        errors: result.errors.length
      },
      duration 
    })

    // Return detailed result
    const response = {
      success: result.success,
      data: {
        judgesProcessed: result.judgesProcessed,
        decisionsProcessed: result.decisionsProcessed,
        decisionsCreated: result.decisionsCreated,
        decisionsUpdated: result.decisionsUpdated,
        duplicatesSkipped: result.duplicatesSkipped,
        duration: result.duration,
        apiDuration: duration
      },
      errors: result.errors,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response, {
      status: result.success ? 200 : 207 // 207 for partial success
    })

  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.error('Decision sync API failed', { error, duration })

    return NextResponse.json(
      {
        success: false,
        error: 'Decision sync failed',
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
        maxDecisionsPerJudge: 'Maximum new decisions to fetch per judge (default: 50)'
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
          judgeIds: ['judge-id-1', 'judge-id-2']
        }
      },
      notes: [
        'This endpoint has stricter rate limiting due to CourtListener API constraints',
        'Processing time may be longer for large datasets',
        'Duplicate decisions are automatically skipped'
      ]
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get sync info' },
      { status: 500 }
    )
  }
}