import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { buildRateLimiter, getClientIp } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  slot_id: z.string().uuid('Invalid slot id'),
  judge_id: z.string().uuid().optional(),
  court_id: z.string().uuid().optional(),
})

function isLikelyBot(req: NextRequest): boolean {
  const ua = req.headers.get('user-agent') || ''
  return /(bot|crawler|spider|crawling|preview|facebookexternalhit|slurp|bing)/i.test(ua)
}

export async function POST(request: NextRequest) {
  const started = Date.now()
  if (isLikelyBot(request)) {
    return NextResponse.json({ ok: true, skipped: 'bot' })
  }

  const limiter = buildRateLimiter({ tokens: 60, window: '1 m', prefix: 'api:ads:imp' })
  const key = `${getClientIp(request) || 'anon'}:${new Date().toISOString().slice(0, 16)}`
  const res = await limiter.limit(key)
  if (!res.success) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid payload' }, { status: 400 })
  }

  const { slot_id } = parsed.data

  try {
    const supabase = await createServerClient()

    const { error: updateError } = await supabase
      .from('ad_spots')
      .update({ impressions_total: supabase.rpc('increment_int', { x: 1 }) as any })
      .eq('id', slot_id)

    if (updateError) {
      logger.error('ad impression update failed', { slot_id, error: updateError.message })
    }

    // Optional: write a lightweight log row for analytics (best-effort)
    const logEvent = await supabase.rpc('log_ad_event', { p_slot_id: slot_id, p_event: 'impression' })
    if (logEvent.error) {
      logger.error('log_ad_event failed', { slot_id, error: logEvent.error.message })
    }

    logger.apiResponse('POST', '/api/advertising/track-impression', 200, Date.now() - started, { slot_id })
    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.apiResponse('POST', '/api/advertising/track-impression', 500, Date.now() - started, {
      error: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json({ error: 'Failed to record impression' }, { status: 500 })
  }
}
