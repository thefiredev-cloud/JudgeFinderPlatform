import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { buildRateLimiter, getClientIp } from '@/lib/security/rate-limit'
import { logger } from '@/lib/utils/logger'
import { validateParams } from '@/lib/utils/validation'

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
})

const limiter = buildRateLimiter({
  tokens: Number(process.env.CORRECTIONS_LIMIT_BURST ?? '5'),
  window: process.env.CORRECTIONS_LIMIT_WINDOW ?? '5 m',
  prefix: 'profile-issue'
})

const dailyLimiter = buildRateLimiter({
  tokens: Number(process.env.CORRECTIONS_LIMIT_DAILY ?? '20'),
  window: process.env.CORRECTIONS_LIMIT_DAILY_WINDOW ?? '1 d',
  prefix: 'profile-issue:daily'
})

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

  const dailyResult = await dailyLimiter.limit(`${clientIp}:${data.judgeSlug}`)
  if (!dailyResult.success) {
    logger.warn('Profile issue daily rate limited', { clientIp, judgeSlug: data.judgeSlug })
    return NextResponse.json(
      { error: 'Too many reports today. Please try again tomorrow or email corrections@judgefinder.io.' },
      { status: 429 },
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

  try {
    const supabase = await createServiceRoleClient()
    const { data: insertedIssue, error } = await supabase
      .from('profile_issues')
      .insert({
        judge_slug: data.judgeSlug.trim(),
        court_id: data.courtId?.trim() ?? null,
        issue_type: data.issueType,
        details: data.details.trim(),
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
        },
      },
    )
  } catch (error) {
    logger.error('Profile issue handler error', { clientIp }, error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
