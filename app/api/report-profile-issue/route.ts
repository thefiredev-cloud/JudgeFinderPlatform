import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { buildRateLimiter, getClientIp } from '@/lib/security/rate-limit'
import { logger } from '@/lib/utils/logger'
import { validateParams } from '@/lib/utils/validation'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const ISSUE_TYPE_VALUES = ['data_accuracy', 'bias_context', 'assignment_change', 'ads_or_policy', 'other'] as const
const issueSchema = z.object({
  judgeSlug: z.string().min(2).max(200),
  courtId: z.string().min(2).max(100).optional(),
  issueType: z.enum(ISSUE_TYPE_VALUES),
  details: z.string().min(10).max(2000),
  reporterEmail: z
    .string()
    .trim()
    .email({ message: 'Invalid email address' })
    .max(200)
    .optional(),
  // Optional Turnstile token (required only when TURNSTILE_SECRET_KEY is configured)
  turnstileToken: z.string().min(10).max(1000).optional(),
})

type RateLimiterInstance = ReturnType<typeof buildRateLimiter>

class ProfileIssueLimiterManager {
  private static burstLimiter: RateLimiterInstance | null = null
  private static dailyLimiter: RateLimiterInstance | null = null

  static getBurstLimiter(): RateLimiterInstance {
    if (!this.burstLimiter) {
      this.burstLimiter = buildRateLimiter({
        tokens: Number(process.env.CORRECTIONS_LIMIT_BURST ?? '5'),
        window: process.env.CORRECTIONS_LIMIT_WINDOW ?? '5 m',
        prefix: 'profile-issue',
      })
    }

    return this.burstLimiter
  }

  static getDailyLimiter(): RateLimiterInstance {
    if (!this.dailyLimiter) {
      this.dailyLimiter = buildRateLimiter({
        tokens: Number(process.env.CORRECTIONS_LIMIT_DAILY ?? '20'),
        window: process.env.CORRECTIONS_LIMIT_DAILY_WINDOW ?? '1 d',
        prefix: 'profile-issue:daily',
      })
    }

    return this.dailyLimiter
  }
}

type IssueType = (typeof ISSUE_TYPE_VALUES)[number]
type Severity = 'high' | 'medium' | 'low'

const ISSUE_SLA_DAYS: Record<Severity, number> = {
  high: 2,
  medium: 4,
  low: 5,
}

function resolveSeverity(issueType: IssueType): Severity {
  switch (issueType) {
    case 'assignment_change':
      return 'high'
    case 'ads_or_policy':
    case 'bias_context':
      return 'medium'
    default:
      return 'low'
  }
}

function resolvePriority(severity: Severity): number {
  switch (severity) {
    case 'high':
      return 90
    case 'medium':
      return 60
    default:
      return 40
  }
}

function computeSlaDue(start: Date, severity: Severity): Date {
  const days = ISSUE_SLA_DAYS[severity] ?? ISSUE_SLA_DAYS.low
  const due = new Date(start)
  due.setUTCDate(due.getUTCDate() + days)
  return due
}

function normalizeDetails(input: string): string {
  // Collapse whitespace and limit consecutive special characters
  let details = input.replace(/\s+/g, ' ').trim()
  // Remove obvious tracking query params in URLs
  details = details.replace(/([?&](utm_[^=]+|fbclid|gclid)=[^\s]+)/gi, '')
  // Remove zero-width/control characters
  details = details.replace(/[\u200B-\u200D\uFEFF\u0000-\u001F\u007F]/g, '')
  // Hard cap length server-side as a safety net
  if (details.length > 2000) {
    details = details.slice(0, 2000)
  }
  return details
}

async function verifyTurnstile(token: string, remoteip: string | null): Promise<{ ok: boolean; score?: number }> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return { ok: true }
  try {
    const body = new URLSearchParams()
    body.set('secret', secret)
    body.set('response', token)
    if (remoteip && remoteip !== 'unknown') {
      body.set('remoteip', remoteip)
    }

    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })
    const json: any = await resp.json()
    return { ok: Boolean(json?.success), score: typeof json?.score === 'number' ? json.score : undefined }
  } catch (error) {
    logger.error('Turnstile verification failed', { error })
    return { ok: false }
  }
}

async function dispatchCorrectionsWebhook(payload: {
  id: string
  judge_slug: string
  court_id: string | null
  issue_type: IssueType
  severity: Severity
  priority: number
  sla_due_at: string | null
  reporter_email: string | null
  meta: Record<string, unknown> | null
}) {
  const webhookUrl = process.env.CORRECTIONS_WEBHOOK_URL
  if (!webhookUrl) return

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'profile_issue.created',
        data: {
          ...payload,
          created_at: new Date().toISOString(),
        },
      }),
    })
  } catch (error) {
    logger.error('Corrections webhook dispatch failed', { error })
  }
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)
  const rateKey = `profile-issue:${clientIp}`
  const rateResult = await ProfileIssueLimiterManager.getBurstLimiter().limit(rateKey)

  if (!rateResult.success) {
    logger.warn('Profile issue rate limited', { clientIp })
    return NextResponse.json(
      { error: 'Too many reports. Please wait a few minutes and try again.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String((rateResult as any).limit ?? ''),
          'X-RateLimit-Remaining': String(rateResult.remaining ?? 0),
          'X-RateLimit-Reset': String(rateResult.reset ?? ''),
        },
      },
    )
  }

  // Enforce content-type and small JSON body size (< 8KB)
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 })
  }

  const contentLength = Number(request.headers.get('content-length') || '0')
  const MAX_BYTES = 8 * 1024 // 8KB
  if (contentLength > 0 && contentLength > MAX_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let payload: unknown

  try {
    // Read as text to enforce size limits, then parse
    const raw = await request.text()
    if (raw.length > MAX_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }
    payload = JSON.parse(raw)
  } catch (error) {
    logger.warn('Profile issue invalid JSON', { clientIp })
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const validation = validateParams(issueSchema, payload, 'report-profile-issue')
  if (!validation.success) {
    return validation.response
  }

  const data = validation.data

  // Optional Turnstile verification (enforced only when TURNSTILE_SECRET_KEY is configured)
  const secretPresent = Boolean(process.env.TURNSTILE_SECRET_KEY)
  const headerToken = request.headers.get('cf-turnstile-token') || request.headers.get('cf-turnstile-response')
  const token = headerToken || (data as any).turnstileToken
  if (secretPresent) {
    if (!token) {
      return NextResponse.json({ error: 'Verification required' }, { status: 400 })
    }
    const verify = await verifyTurnstile(token, clientIp)
    if (!verify.ok) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
    }
  }

  const dailyResult = await ProfileIssueLimiterManager.getDailyLimiter().limit(`${clientIp}:${data.judgeSlug}`)
  if (!dailyResult.success) {
    logger.warn('Profile issue daily rate limited', { clientIp, judgeSlug: data.judgeSlug })
    return NextResponse.json(
      { error: 'Too many reports today. Please try again tomorrow or email corrections@judgefinder.io.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String((dailyResult as any).limit ?? ''),
          'X-RateLimit-Remaining': String(dailyResult.remaining ?? 0),
          'X-RateLimit-Reset': String(dailyResult.reset ?? ''),
        },
      },
    )
  }

  const severity = resolveSeverity(data.issueType)
  const priority = resolvePriority(severity)
  const now = new Date()
  const slaDueAt = computeSlaDue(now, severity)
  const metadata: Record<string, unknown> = {
    submission_channel: 'web',
    client_ip: clientIp,
  }

  if (data.courtId) {
    metadata.court_id = data.courtId.trim()
  }

  const referer = request.headers.get('referer')
  if (referer) {
    metadata.referrer = referer
  }

  const userAgent = request.headers.get('user-agent')
  if (userAgent) {
    metadata.user_agent = userAgent
  }

  // Add a privacy-preserving fingerprint (IP + UA + day) to deter abuse
  try {
    const dayBucket = new Date(now)
    dayBucket.setUTCHours(0, 0, 0, 0)
    const fpSource = `${clientIp || 'unknown'}|${userAgent || 'unknown'}|${dayBucket.toISOString()}`
    const fingerprint = crypto.createHash('sha256').update(fpSource).digest('hex')
    metadata.fingerprint_hash = fingerprint
  } catch {}

  try {
    const supabase = await createServiceRoleClient()
    const { data: insertedIssue, error } = await supabase
      .from('profile_issues')
      .insert({
        judge_slug: data.judgeSlug.trim(),
        court_id: data.courtId?.trim() ?? null,
        issue_type: data.issueType,
        details: normalizeDetails(data.details),
        reporter_email: data.reporterEmail?.trim().toLowerCase() ?? null,
        severity,
        priority,
        sla_due_at: slaDueAt.toISOString(),
        last_status_change_at: now.toISOString(),
        meta: metadata,
      })
      .select('id, judge_slug, court_id, issue_type, severity, priority, sla_due_at, reporter_email, meta')
      .single()

    if (error || !insertedIssue) {
      logger.error('Failed to record profile issue', { clientIp, error: error?.message })
      return NextResponse.json({ error: 'Unable to record issue right now' }, { status: 500 })
    }

    logger.info('Profile issue recorded', {
      id: insertedIssue.id,
      judgeSlug: data.judgeSlug,
      courtId: data.courtId,
      severity,
      priority,
      slaDueAt: slaDueAt.toISOString(),
    })

    await dispatchCorrectionsWebhook(insertedIssue)

    const slaDays = ISSUE_SLA_DAYS[severity]

    return NextResponse.json(
      { message: `Issue submitted. Our transparency team will review within ${slaDays} business day${slaDays === 1 ? '' : 's'}.` },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-store',
          'X-RateLimit-Limit': String((rateResult as any).limit ?? ''),
          'X-RateLimit-Remaining': String(rateResult.remaining ?? 0),
          'X-RateLimit-Reset': String(rateResult.reset ?? ''),
        },
      },
    )
  } catch (error) {
    logger.error('Profile issue handler error', { clientIp }, error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
