import 'server-only'

import { headers } from 'next/headers'
import { logger } from '@/lib/utils/logger'

export interface SyncStatusResponse {
  timestamp: string
  health: {
    status: 'healthy' | 'warning' | 'critical' | 'caution'
    metrics: Array<Record<string, unknown>>
    uptime: number
  }
  queue: {
    stats: {
      pending: number
      running: number
      succeeded: number
      failed: number
    }
    status: Array<Record<string, unknown>>
    backlog: number
  }
  performance: {
    daily: {
      total_runs: number
      success_rate: number
      avg_duration_ms: number
      failed_runs: number
    }
    weekly: {
      total_runs: number
      success_rate: number
      failed_runs: number
    }
    external_api: {
      courtlistener_failures_24h: number
      courtlistener_circuit_opens_24h: number
      courtlistener_circuit_shortcircuits_24h: number
    }
  }
  freshness: {
    judges: {
      last_sync: string | null
      hours_since: number | null
    }
    decisions: {
      last_created: string | null
      hours_since: number | null
    }
  }
  recent_logs: Array<{
    id: string
    sync_type: string
    status: string
    started_at: string
    duration_ms: number | null
    error_message?: string | null
  }>
  sync_breakdown: Array<Record<string, unknown>>
}

async function resolveInternalBaseUrl(): Promise<string> {
  const headerList = await headers()
  const hint = process.env.INTERNAL_ADMIN_API_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL
  if (hint) {
    return hint
  }

  const host = headerList.get('x-forwarded-host') || headerList.get('host')
  if (host) {
    const protocol = headerList.get('x-forwarded-proto') || 'https'
    return `${protocol}://${host}`
  }

  return 'http://127.0.0.1:3000'
}

function getAdminApiKey(): string {
  const key = process.env.SYNC_API_KEY || process.env.CRON_SECRET
  if (!key) {
    throw new Error('Missing SYNC_API_KEY or CRON_SECRET for admin operations')
  }
  return key
}

export async function fetchSyncStatus(): Promise<SyncStatusResponse | null> {
  try {
    const baseUrl = await resolveInternalBaseUrl()
    const response = await fetch(`${baseUrl}/api/admin/sync-status`, {
      cache: 'no-store',
      headers: {
        'x-api-key': getAdminApiKey()
      }
    })

    if (!response.ok) {
      logger.error('Failed to fetch admin sync status', { status: response.status })
      return null
    }

    const data = (await response.json()) as SyncStatusResponse
    return data
  } catch (error) {
    logger.error('Error fetching admin sync status', { error })
    return null
  }
}

export async function runSyncAdminAction(action: string, payload: Record<string, unknown> = {}) {
  const baseUrl = await resolveInternalBaseUrl()
  const response = await fetch(`${baseUrl}/api/admin/sync-status`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'content-type': 'application/json',
      'x-api-key': getAdminApiKey()
    },
    body: JSON.stringify({ action, ...payload })
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    logger.error('Admin sync action failed', { status: response.status, errorBody })
    throw new Error(`Admin action failed with status ${response.status}`)
  }

  return response.json().catch(() => ({}))
}
