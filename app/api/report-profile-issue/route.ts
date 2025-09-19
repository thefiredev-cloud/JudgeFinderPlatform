import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { buildRateLimiter, getClientIp } from '@/lib/security/rate-limit'
import { logger } from '@/lib/utils/logger'
import { validateParams } from '@/lib/utils/validation'

const issueSchema = z.object({
  judgeSlug: z.string().min(2).max(200),
  courtId: z.string().min(2).max(100).optional(),
  issueType: z.string().min(2).max(120),
  details: z.string().min(10).max(2000),
  reporterEmail: z
    .string()
    .trim()
    .email({ message: 'Invalid email address' })
    .max(200)
    .optional(),
})

const limiter = buildRateLimiter({ tokens: 5, window: '5 m', prefix: 'profile-issue' })

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)
  const rateKey = `profile-issue:${clientIp}`
  const rateResult = await limiter.limit(rateKey)

  if (!rateResult.success) {
    logger.warn('Profile issue rate limited', { clientIp })
    return NextResponse.json(
      { error: 'Too many reports. Please wait a few minutes and try again.' },
      { status: 429 },
    )
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch (error) {
    logger.warn('Profile issue invalid JSON', { clientIp })
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const validation = validateParams(issueSchema, payload, 'report-profile-issue')
  if (!validation.success) {
    return validation.response
  }

  const data = validation.data

  try {
    const supabase = await createServiceRoleClient()
    const { error } = await supabase.from('profile_issues').insert({
      judge_slug: data.judgeSlug.trim(),
      court_id: data.courtId?.trim() ?? null,
      issue_type: data.issueType.trim(),
      details: data.details.trim(),
      reporter_email: data.reporterEmail?.trim() ?? null,
    })

    if (error) {
      logger.error('Failed to record profile issue', { clientIp, error: error.message })
      return NextResponse.json({ error: 'Unable to record issue right now' }, { status: 500 })
    }

    logger.info('Profile issue recorded', {
      judgeSlug: data.judgeSlug,
      courtId: data.courtId,
    })

    return NextResponse.json(
      { message: 'Issue submitted. Our team will review and follow up soon.' },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    logger.error('Profile issue handler error', { clientIp }, error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
