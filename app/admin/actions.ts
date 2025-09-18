'use server'

import { requireAdmin } from '@/lib/auth/is-admin'
import { runSyncAdminAction } from '@/lib/admin/sync-status'

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
