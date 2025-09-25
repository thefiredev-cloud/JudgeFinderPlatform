'use server'

import { requireAdmin } from '@/lib/auth/is-admin'
import { runSyncAdminAction } from '@/lib/admin/sync-status'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { SupabaseClient } from '@supabase/supabase-js'

type ProfileIssueStatus = 'new' | 'researching' | 'resolved' | 'dismissed'

export async function queueSyncJob({
  type,
  options,
  priority
}: {
  type: string
  options?: Record<string, unknown>
  priority?: number
}): Promise<unknown> {
  await requireAdmin()
  const payload: Record<string, unknown> = { type }
  if (options) payload.options = options
  if (typeof priority === 'number') payload.priority = priority
  return runSyncAdminAction('queue_job', payload)
}

export async function cancelSyncJobs(type?: string): Promise<unknown> {
  await requireAdmin()
  const payload: Record<string, unknown> = {}
  if (type) payload.type = type
  return runSyncAdminAction('cancel_jobs', payload)
}

export async function restartSyncQueue(): Promise<unknown> {
  await requireAdmin()
  return runSyncAdminAction('restart_queue')
}

interface TransitionProfileIssueArgs {
  id: string
  nextStatus: ProfileIssueStatus
  responseNotes?: string
}

function buildIssueUpdatePayload(nextStatus: ProfileIssueStatus, responseNotes: string | undefined, nowIso: string): Record<string, unknown> {
  const updates: Record<string, unknown> = {
    status: nextStatus,
    last_status_change_at: nowIso,
  }

  if (typeof responseNotes === 'string') {
    const trimmed = responseNotes.trim()
    updates.response_notes = trimmed.length > 0 ? trimmed : null
  }

  switch (nextStatus) {
    case 'new':
      updates.acknowledged_at = null
      updates.resolved_at = null
      break
    case 'researching':
      updates.acknowledged_at = nowIso
      updates.resolved_at = null
      break
    case 'resolved':
      updates.resolved_at = nowIso
      break
    case 'dismissed':
      updates.resolved_at = nowIso
      break
  }

  return updates
}

async function upsertIssueStatus(
  supabase: SupabaseClient,
  id: string,
  updates: Record<string, unknown>
): Promise<{ sla_due_at: string | null; status: ProfileIssueStatus; breached_at: string | null } | null> {
  const { data, error } = await supabase
    .from('profile_issues')
    .update(updates)
    .eq('id', id)
    .select('sla_due_at, status, breached_at')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data ?? null
}

async function markBreachedIfApplicable(
  supabase: SupabaseClient,
  id: string,
  row: { sla_due_at: string | null; status: ProfileIssueStatus; breached_at: string | null },
  nowIso: string
): Promise<void> {
  if (!row?.sla_due_at || row.breached_at || row.status === 'resolved' || row.status === 'dismissed') return
  const due = new Date(row.sla_due_at)
  if (Number.isNaN(due.getTime()) || due.getTime() >= Date.now()) return
  await supabase.from('profile_issues').update({ breached_at: nowIso }).eq('id', id)
}

export async function transitionProfileIssue({ id, nextStatus, responseNotes }: TransitionProfileIssueArgs): Promise<{ success: true }> {
  await requireAdmin()
  const supabase = await createServiceRoleClient()

  const now = new Date()
  const nowIso = now.toISOString()
  try {
    const updates = buildIssueUpdatePayload(nextStatus, responseNotes, nowIso)
    const row = await upsertIssueStatus(supabase, id, updates)
    if (row) {
      await markBreachedIfApplicable(supabase, id, row, nowIso)
    }
    logger.info('Profile issue transitioned', { id, nextStatus })
  } catch (error: unknown) {
    const message = typeof error === 'object' && error && 'message' in error ? String((error as { message?: string }).message) : String(error)
    logger.error('Failed to transition profile issue', { id, nextStatus, error: message })
    throw new Error('Unable to transition issue status')
  }
  return { success: true }
}
