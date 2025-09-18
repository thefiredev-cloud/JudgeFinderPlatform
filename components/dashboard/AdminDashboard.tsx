'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { queueSyncJob, cancelSyncJobs, restartSyncQueue } from '@/app/admin/actions'
import type { SyncStatusResponse } from '@/lib/admin/sync-status'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCcw,
  RefreshCw,
  Server,
  Activity,
  BarChart3,
  PlayCircle,
  Square,
  Triangle
} from 'lucide-react'

interface AdminDashboardProps {
  status: SyncStatusResponse | null
}

type ActionType = 'queue-decisions' | 'cancel-decisions' | 'restart-queue'

type Feedback = {
  type: 'success' | 'error'
  message: string
}

const ACTION_META: Record<ActionType, { title: string; description: string; confirmLabel: string }> = {
  'queue-decisions': {
    title: 'Queue CA decision document sync',
    description: 'Adds a high-priority job to pull recent CourtListener decisions for California.',
    confirmLabel: 'Queue job'
  },
  'cancel-decisions': {
    title: 'Cancel pending decision jobs',
    description: 'Stops queued decision document jobs to prevent duplicates.',
    confirmLabel: 'Cancel jobs'
  },
  'restart-queue': {
    title: 'Restart sync queue processor',
    description: 'Stops and restarts the queue worker to clear stuck jobs.',
    confirmLabel: 'Restart queue'
  }
}

function formatNumber(value: number | null | undefined, fallback = '0') {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return value.toLocaleString()
}

function formatRelative(dateString: string | null | undefined) {
  if (!dateString) return 'Unknown'
  const target = new Date(dateString)
  if (Number.isNaN(target.getTime())) return 'Unknown'

  const diffMs = Date.now() - target.getTime()
  if (diffMs < 0) return 'Just now'

  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

function healthPill(status: SyncStatusResponse['health']['status']) {
  switch (status) {
    case 'healthy':
      return {
        label: 'Healthy',
        className: 'bg-green-50 text-green-700 border border-green-200',
        icon: CheckCircle2
      }
    case 'warning':
      return {
        label: 'Warning',
        className: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
        icon: AlertTriangle
      }
    case 'critical':
      return {
        label: 'Critical',
        className: 'bg-red-50 text-red-700 border border-red-200',
        icon: AlertTriangle
      }
    case 'caution':
      return {
        label: 'Caution',
        className: 'bg-orange-50 text-orange-700 border border-orange-200',
        icon: AlertTriangle
      }
    default:
      return {
        label: 'Unknown',
        className: 'bg-gray-100 text-gray-700 border border-gray-200',
        icon: Clock
      }
  }
}

export default function AdminDashboard({ status }: AdminDashboardProps) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [isPending, startTransition] = useTransition()

  const health = useMemo(() => healthPill(status?.health.status || 'caution'), [status?.health.status])

  const handleAction = (action: ActionType) => {
    setPendingAction(action)
  }

  const executeAction = () => {
    if (!pendingAction) return
    const action = pendingAction

    startTransition(async () => {
      try {
        switch (action) {
          case 'queue-decisions':
            await queueSyncJob({
              type: 'decision',
              options: {
                jurisdiction: 'CA',
                schedule: 'daily',
                priority: 'high',
                forceRefresh: true
              },
              priority: 80
            })
            setFeedback({ type: 'success', message: 'Decision job queued successfully.' })
            break
          case 'cancel-decisions':
            await cancelSyncJobs('decision')
            setFeedback({ type: 'success', message: 'Pending decision jobs cancelled.' })
            break
          case 'restart-queue':
            await restartSyncQueue()
            setFeedback({ type: 'success', message: 'Queue restarted successfully.' })
            break
        }
      } catch (error) {
        console.error(error)
        setFeedback({ type: 'error', message: 'Action failed. Check server logs for details.' })
      } finally {
        setPendingAction(null)
        router.refresh()
      }
    })
  }

  const cancelAction = () => {
    setPendingAction(null)
  }

  if (!status) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Unable to load operations data</p>
          <p className="text-sm text-gray-600">Verify SYNC_API_KEY and admin API availability.</p>
        </div>
        <button
          onClick={() => router.refresh()}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />Try again
        </button>
      </div>
    )
  }

  const queueStats = status.queue?.stats || { pending: 0, running: 0, succeeded: 0, failed: 0 }
  const external = status.performance?.external_api || {
    courtlistener_failures_24h: 0,
    courtlistener_circuit_opens_24h: 0,
    courtlistener_circuit_shortcircuits_24h: 0
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Operations Dashboard</h1>
          <p className="text-gray-600">Monitor sync pipelines, queue health, and CourtListener integrations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${health.className}`}>
            <health.icon className="h-4 w-4" />
            {health.label}
          </div>
          <div className="text-sm text-gray-500">
            Last updated {formatRelative(status.timestamp)}
          </div>
          <button
            onClick={() => router.refresh()}
            className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Queue backlog</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{formatNumber(status.queue?.backlog)}</p>
            </div>
            <Server className="h-10 w-10 text-blue-500" />
          </div>
          <p className="mt-3 text-xs text-gray-500">Pending + running jobs.</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Daily success rate</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{formatNumber(status.performance?.daily?.success_rate, '0')}%</p>
            </div>
            <BarChart3 className="h-10 w-10 text-purple-500" />
          </div>
          <p className="mt-3 text-xs text-gray-500">{formatNumber(status.performance?.daily?.failed_runs)} failures in the last 24h.</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CourtListener incidents (24h)</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{formatNumber(external.courtlistener_failures_24h)}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-amber-500" />
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Circuit opens: {formatNumber(external.courtlistener_circuit_opens_24h)} · Short-circuits: {formatNumber(external.courtlistener_circuit_shortcircuits_24h)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Judge data freshness</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{formatRelative(status.freshness?.judges?.last_sync)}</p>
            </div>
            <Clock className="h-10 w-10 text-teal-500" />
          </div>
          <p className="mt-3 text-xs text-gray-500">Decisions updated {formatRelative(status.freshness?.decisions?.last_created)}.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Queue status</h2>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="px-6 py-4">
            <dl className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="rounded-md bg-gray-50 p-4">
                <dt className="font-medium text-gray-500">Pending</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">{formatNumber(queueStats.pending)}</dd>
              </div>
              <div className="rounded-md bg-gray-50 p-4">
                <dt className="font-medium text-gray-500">Running</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">{formatNumber(queueStats.running)}</dd>
              </div>
              <div className="rounded-md bg-gray-50 p-4">
                <dt className="font-medium text-gray-500">Succeeded (24h)</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">{formatNumber(queueStats.succeeded)}</dd>
              </div>
              <div className="rounded-md bg-gray-50 p-4">
                <dt className="font-medium text-gray-500">Failed (24h)</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">{formatNumber(queueStats.failed)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Performance summary</h2>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-2">
            <div className="rounded-md bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">Daily</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{formatNumber(status.performance?.daily?.total_runs)}</p>
              <p className="mt-1 text-sm text-gray-600">Avg duration {formatNumber(status.performance?.daily?.avg_duration_ms)} ms</p>
            </div>
            <div className="rounded-md bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">Weekly</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{formatNumber(status.performance?.weekly?.total_runs)}</p>
              <p className="mt-1 text-sm text-gray-600">Failures {formatNumber(status.performance?.weekly?.failed_runs)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Recent sync activity</h2>
          <Triangle className="h-5 w-5 text-gray-400 rotate-180" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-700">Sync type</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-700">Started</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-700">Duration (ms)</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-700">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {status.recent_logs.slice(0, 8).map(log => (
                <tr key={log.id}>
                  <td className="px-6 py-3 text-gray-900">{log.sync_type}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                        log.status === 'completed'
                          ? 'bg-green-50 text-green-700'
                          : log.status === 'failed'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {log.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : log.status === 'failed' ? <AlertTriangle className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{formatRelative(log.started_at)}</td>
                  <td className="px-6 py-3 text-gray-600">{formatNumber(log.duration_ms)}</td>
                  <td className="px-6 py-3 text-gray-600">{log.error_message || '—'}</td>
                </tr>
              ))}
              {status.recent_logs.length === 0 && (
                <tr>
                  <td className="px-6 py-4 text-center text-gray-500" colSpan={5}>
                    No recent sync jobs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Admin actions</h2>
            <p className="text-xs text-gray-500">Actions run via secure server-side API key.</p>
          </div>
          {isPending && (
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <RefreshCcw className="h-4 w-4 animate-spin" />Processing…
            </div>
          )}
        </div>
        <div className="grid gap-4 px-6 py-6 md:grid-cols-3">
          <button
            onClick={() => handleAction('queue-decisions')}
            className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-left text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            <div className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Queue CA decision sync
            </div>
            <p className="mt-1 text-xs font-normal text-blue-600/80">Runs the daily high-priority CA decision ingest.</p>
          </button>
          <button
            onClick={() => handleAction('cancel-decisions')}
            className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm font-medium text-amber-700 hover:bg-amber-100"
          >
            <div className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              Cancel decision jobs
            </div>
            <p className="mt-1 text-xs font-normal text-amber-600/80">Stops duplicate or stale decision sync jobs.</p>
          </button>
          <button
            onClick={() => handleAction('restart-queue')}
            className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              Restart queue processor
            </div>
            <p className="mt-1 text-xs font-normal text-gray-500">Gracefully restarts the queue worker.</p>
          </button>
        </div>
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">{ACTION_META[pendingAction].title}</h3>
            <p className="mt-2 text-sm text-gray-600">{ACTION_META[pendingAction].description}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={cancelAction}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                disabled={isPending}
              >
                {ACTION_META[pendingAction].confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
