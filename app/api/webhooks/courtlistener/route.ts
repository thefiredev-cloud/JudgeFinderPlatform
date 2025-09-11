import { NextRequest, NextResponse } from 'next/server'
import { SyncQueueManager } from '@/lib/sync/queue-manager'
import { logger } from '@/lib/utils/logger'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'
export const maxDuration = 120 // 2 minutes for webhook processing

interface CourtListenerWebhookPayload {
  event: 'opinion.created' | 'opinion.updated' | 'person.updated' | 'court.updated'
  data: {
    id: string
    type: string
    attributes: any
  }
  timestamp: string
  webhook_id: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify webhook signature
    const signature = request.headers.get('x-courtlistener-signature')
    const body = await request.text()
    
    if (!signature || !verifyWebhookSignature(body, signature)) {
      logger.warn('Invalid webhook signature', { 
        hasSignature: !!signature,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse webhook payload
    let payload: CourtListenerWebhookPayload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      logger.error('Invalid webhook payload', { error, body: body.substring(0, 500) })
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    logger.info('Received CourtListener webhook', { 
      event: payload.event, 
      dataId: payload.data.id,
      webhookId: payload.webhook_id
    })

    // Process webhook based on event type
    const result = await processWebhookEvent(payload)

    const duration = Date.now() - startTime

    logger.info('Webhook processed successfully', { 
      event: payload.event,
      result,
      duration
    })

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      event: payload.event,
      result,
      processedAt: new Date().toISOString(),
      duration
    })

  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.error('Webhook processing failed', { error, duration })

    return NextResponse.json({
      success: false,
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * Verify webhook signature from CourtListener
 */
function verifyWebhookSignature(body: string, signature: string): boolean {
  const webhookSecret = process.env.COURTLISTENER_WEBHOOK_SECRET
  if (!webhookSecret) {
    logger.warn('No webhook secret configured')
    return false
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body, 'utf8')
      .digest('hex')

    // Remove 'sha256=' prefix if present
    const receivedSignature = signature.replace('sha256=', '')
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    )
  } catch (error) {
    logger.error('Signature verification failed', { error })
    return false
  }
}

/**
 * Process webhook event based on type
 */
async function processWebhookEvent(payload: CourtListenerWebhookPayload) {
  const queueManager = new SyncQueueManager()

  switch (payload.event) {
    case 'opinion.created':
    case 'opinion.updated':
      return await handleOpinionEvent(payload, queueManager)

    case 'person.updated':
      return await handlePersonEvent(payload, queueManager)

    case 'court.updated':
      return await handleCourtEvent(payload, queueManager)

    default:
      logger.warn('Unknown webhook event type', { event: payload.event })
      return { message: 'Event type not handled', handled: false }
  }
}

/**
 * Handle opinion creation/update events
 */
async function handleOpinionEvent(
  payload: CourtListenerWebhookPayload, 
  queueManager: SyncQueueManager
) {
  const opinionId = payload.data.id
  const attributes = payload.data.attributes || {}

  logger.info('Processing opinion webhook', { 
    opinionId, 
    event: payload.event,
    authorId: attributes.author
  })

  // If we have author information, queue a decision sync for that judge
  if (attributes.author) {
    const jobId = await queueManager.addJob(
      'decision',
      {
        judgeIds: [attributes.author],
        batchSize: 1,
        maxDecisionsPerJudge: 10,
        daysSinceLast: 1 // Recent decisions only
      },
      200 // High priority for real-time updates
    )

    return {
      message: 'Decision sync queued for judge',
      judgeId: attributes.author,
      jobId,
      handled: true
    }
  }

  return {
    message: 'Opinion event received but no author to sync',
    handled: false
  }
}

/**
 * Handle person (judge) update events
 */
async function handlePersonEvent(
  payload: CourtListenerWebhookPayload, 
  queueManager: SyncQueueManager
) {
  const personId = payload.data.id

  logger.info('Processing person webhook', { 
    personId, 
    event: payload.event 
  })

  // Queue judge sync for the updated person
  const jobId = await queueManager.addJob(
    'judge',
    {
      judgeIds: [personId],
      batchSize: 1,
      forceRefresh: true
    },
    200 // High priority for real-time updates
  )

  return {
    message: 'Judge sync queued for updated person',
    personId,
    jobId,
    handled: true
  }
}

/**
 * Handle court update events
 */
async function handleCourtEvent(
  payload: CourtListenerWebhookPayload, 
  queueManager: SyncQueueManager
) {
  const courtId = payload.data.id

  logger.info('Processing court webhook', { 
    courtId, 
    event: payload.event 
  })

  // Queue court sync for the updated court
  const jobId = await queueManager.addJob(
    'court',
    {
      courtIds: [courtId], // Note: This would need to be added to court sync options
      batchSize: 1,
      forceRefresh: true
    },
    150 // Medium priority
  )

  return {
    message: 'Court sync queued for updated court',
    courtId,
    jobId,
    handled: true
  }
}

/**
 * Webhook verification endpoint (for CourtListener setup)
 */
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('hub.challenge')
  const verifyToken = request.nextUrl.searchParams.get('hub.verify_token')

  // Verify the token matches our expected webhook verify token
  if (verifyToken === process.env.COURTLISTENER_WEBHOOK_VERIFY_TOKEN) {
    logger.info('Webhook verification successful')
    return new NextResponse(challenge, { status: 200 })
  }

  logger.warn('Webhook verification failed', { verifyToken })
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}