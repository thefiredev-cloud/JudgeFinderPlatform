'use server'

import { requireAdmin } from '@/lib/auth/is-admin'
import { runSyncAdminAction } from '@/lib/admin/sync-status'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

type ProfileIssueStatus = 'new' | 'researching' | 'resolved' | 'dismissed'

export async function queueSyncJob({
  type,
  options,
  priority
}: {
  type: string
  options?: Record<string, unknown>
  priority?: number
}) {
  await requireAdmin()
  const payload: Record<string, unknown> = { type }
  if (options) payload.options = options
  if (typeof priority === 'number') payload.priority = priority
  return runSyncAdminAction('queue_job', payload)
}

export async function cancelSyncJobs(type?: string) {
  await requireAdmin()
  const payload: Record<string, unknown> = {}
  if (type) payload.type = type
  return runSyncAdminAction('cancel_jobs', payload)
}

export async function restartSyncQueue() {
  await requireAdmin()
  return runSyncAdminAction('restart_queue')
}

interface TransitionProfileIssueArgs {
  id: string
  nextStatus: ProfileIssueStatus
  responseNotes?: string
}

export async function transitionProfileIssue({ id, nextStatus, responseNotes }: TransitionProfileIssueArgs) {
  await requireAdmin()
  const supabase = await createServiceRoleClient()

  const now = new Date()
  const nowIso = now.toISOString()
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

  const { data, error } = await supabase
    .from('profile_issues')
    .update(updates)
    .eq('id', id)
    .select('sla_due_at, status, breached_at')
    .single()

  if (error) {
    logger.error('Failed to transition profile issue', { id, nextStatus, error: error.message })
    throw new Error('Unable to transition issue status')
  }

  if (
    data &&
    data.sla_due_at &&
    !data.breached_at &&
    data.status !== 'resolved' &&
    data.status !== 'dismissed'
  ) {
    const due = new Date(data.sla_due_at)
    if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) {
      await supabase
        .from('profile_issues')
        .update({ breached_at: nowIso })
        .eq('id', id)
    }
  }

  logger.info('Profile issue transitioned', { id, nextStatus })
  return { success: true }
}
