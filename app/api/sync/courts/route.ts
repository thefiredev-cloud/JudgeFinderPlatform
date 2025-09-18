import { NextRequest, NextResponse } from 'next/server'
import { CourtSyncManager } from '@/lib/sync/court-sync'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for court sync

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { requireApiKey } = await import('@/lib/security/api-auth')
    const auth = requireApiKey(request, { allow: ['SYNC_API_KEY'] })
    if ('ok' in auth === false) return auth

    // Parse request options
    const body = await request.json().catch(() => ({}))
    const options = {
      batchSize: body.batchSize || 20,
      jurisdiction: body.jurisdiction || 'CA',
      forceRefresh: body.forceRefresh || false,
      ...body
    }

    logger.info('Starting court sync via API', { options })

    // Initialize sync manager and run sync
    const syncManager = new CourtSyncManager()
    const result = await syncManager.syncCourts(options)

    const duration = Date.now() - startTime

    logger.info('Court sync API completed', { 
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
        courtsProcessed: result.courtsProcessed,
        courtsUpdated: result.courtsUpdated,
        courtsCreated: result.courtsCreated,
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
    
    logger.error('Court sync API failed', { error, duration })

    return NextResponse.json(
      {
        success: false,
        error: 'Court sync failed',
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
      endpoint: 'courts',
      methods: ['POST'],
      description: 'Synchronize court data from CourtListener API',
      options: {
        batchSize: 'Number of courts to process in each batch (default: 20)',
        jurisdiction: 'Filter by jurisdiction (default: CA)',
        forceRefresh: 'Force refresh all courts regardless of last update (default: false)'
      },
      example: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'your-sync-api-key'
        },
        body: {
          batchSize: 20,
          jurisdiction: 'CA',
          forceRefresh: false
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