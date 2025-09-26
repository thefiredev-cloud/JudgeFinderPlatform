import { NextRequest, NextResponse } from 'next/server'
import { JudgeSyncManager } from '@/lib/sync/judge-sync'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for judge sync

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { requireApiKey } = await import('@/lib/security/api-auth')
    const auth = requireApiKey(request, { allow: ['SYNC_API_KEY'] })
    if ('ok' in auth === false) return auth


    // Parse request options
    const body = await request.json().catch(() => ({}))
    const options = {
      batchSize: body.batchSize || 10,
      jurisdiction: body.jurisdiction || 'CA',
      forceRefresh: body.forceRefresh || false,
      judgeIds: body.judgeIds || undefined,
      ...body
    }

    logger.info('Starting judge sync via API', { 
      options: {
        ...options,
        judgeIds: options.judgeIds ? `${options.judgeIds.length} judges` : undefined
      }
    })

    // Initialize sync manager and run sync
    const syncManager = new JudgeSyncManager()
    const result = await syncManager.syncJudges(options)

    const duration = Date.now() - startTime

    logger.info('Judge sync API completed', { 
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
        judgesUpdated: result.judgesUpdated,
        judgesCreated: result.judgesCreated,
        profilesEnhanced: result.profilesEnhanced,
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
    
    logger.error('Judge sync API failed', { error, duration })

    return NextResponse.json(
      {
        success: false,
        error: 'Judge sync failed',
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
      endpoint: 'judges',
      methods: ['POST'],
      description: 'Synchronize judge data from CourtListener API',
      options: {
        batchSize: 'Number of judges to process in each batch (default: 10)',
        jurisdiction: 'Filter by jurisdiction (default: CA)',
        forceRefresh: 'Force refresh all judges regardless of last update (default: false)',
        judgeIds: 'Array of specific judge IDs to sync (optional)'
      },
      example: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'your-sync-api-key'
        },
        body: {
          batchSize: 10,
          jurisdiction: 'CA',
          forceRefresh: false,
          judgeIds: ['judge-id-1', 'judge-id-2']
        }
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get sync info' },
      { status: 500 }
    )
  }
}