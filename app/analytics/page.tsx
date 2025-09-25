'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BarChart3, ArrowLeft, Clock, Database, RefreshCcw } from 'lucide-react'
import type { DashboardStats, FreshnessRow } from './StatsTypes'

export const dynamic = 'force-dynamic'

function formatPercent(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toFixed(1)}%`
}

function formatLatency(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${Math.round(value)} ms`
}

function Header(): JSX.Element {
  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCards({ stats, loading }: { stats: DashboardStats | null; loading: boolean }): JSX.Element {
  return (
    <div className="bg-card rounded-lg border border-border p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Coverage & Freshness</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading…' : 'Updated'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-4 rounded-lg border border-border bg-background">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Database className="h-4 w-4" />
            Total Judges
          </div>
          <div className="text-3xl font-bold">{stats && stats.totalJudges !== null ? stats.totalJudges.toLocaleString() : '—'}</div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-background">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Database className="h-4 w-4" />
            Case Records
          </div>
          <div className="text-3xl font-bold">{stats && stats.totalCases !== null ? stats.totalCases.toLocaleString() : '—'}</div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-background">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Database className="h-4 w-4" />
            CA Courts
          </div>
          <div className="text-3xl font-bold">{stats && stats.totalCourts !== null ? stats.totalCourts.toLocaleString() : '—'}</div>
        </div>
      </div>
    </div>
  )
}

function OperationalMetrics({ stats }: { stats: DashboardStats | null }): JSX.Element {
  return (
    <div className="mt-8 border-t border-border pt-6">
      <h3 className="text-xl font-semibold text-foreground">Operational metrics (last 24h)</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="text-sm text-muted-foreground">Sync success</div>
          <div className="mt-2 text-2xl font-semibold">{stats ? formatPercent(stats.syncSuccessRate) : '—'}</div>
          <div className="mt-1 text-xs text-muted-foreground">Retry attempts: {stats ? stats.retryCount.toLocaleString() : '—'}</div>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="text-sm text-muted-foreground">Pending jobs</div>
          <div className="mt-2 text-2xl font-semibold">{stats ? stats.pendingSync.toLocaleString() : '—'}</div>
          <div className="mt-1 text-xs text-muted-foreground">Active users: {stats && typeof stats.activeUsers === 'number' ? stats.activeUsers.toLocaleString() : '—'}</div>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="text-sm text-muted-foreground">Cache hit ratio</div>
          <div className="mt-2 text-2xl font-semibold">{stats ? formatPercent(stats.cacheHitRatio) : '—'}</div>
          <div className="mt-1 text-xs text-muted-foreground">Lookup volume: {stats && typeof stats.searchVolume === 'number' ? stats.searchVolume.toLocaleString() : '—'}</div>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="text-sm text-muted-foreground">Latency (p50 / p95)</div>
          <div className="mt-2 text-2xl font-semibold">
            {stats ? formatLatency(stats.latencyP50) : '—'}
            <span className="text-sm text-muted-foreground"> / {stats ? formatLatency(stats.latencyP95) : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function FreshnessTable({ freshness }: { freshness: FreshnessRow[] }): JSX.Element {
  return (
    <div className="mt-8">
      <div className="text-sm font-medium mb-2">Freshness by Court (latest filing date)</div>
      <div className="overflow-auto border border-border rounded-lg">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2">Court</th>
              <th className="text-left p-2">Last Update</th>
            </tr>
          </thead>
          <tbody>
            {freshness.map((row) => (
              <tr key={row.court_id} className="border-t border-border">
                <td className="p-2">{row.court_name}</td>
                <td className="p-2 text-muted-foreground">{row.last_update ? new Date(row.last_update).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AnalyticsPage(): JSX.Element {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [freshness, setFreshness] = useState<FreshnessRow[]>([])

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const [judgesRes, courtsRes, casesRes, platformRes, freshRes] = await Promise.all([
          fetch('/api/stats/judges', { cache: 'no-store' }),
          fetch('/api/stats/courts', { cache: 'no-store' }),
          fetch('/api/stats/cases', { cache: 'no-store' }),
          fetch('/api/stats/platform', { cache: 'no-store' }),
          fetch('/api/stats/freshness-by-court', { cache: 'no-store' })
        ])

        const [judges, courts, cases, platform, fresh] = await Promise.all([
          judgesRes.json(),
          courtsRes.json(),
          casesRes.json(),
          platformRes.json(),
          freshRes.json(),
        ])

        const combined: DashboardStats = {
          totalJudges: typeof judges?.totalJudges === 'number' ? judges.totalJudges : null,
          totalCourts: typeof courts?.totalCourts === 'number' ? courts.totalCourts : null,
          totalCases: typeof cases?.totalCases === 'number' ? cases.totalCases : null,
          pendingSync: 0,
          lastSyncTime: cases?.lastUpdate || null,
          systemHealth: 'healthy',
          activeUsers: typeof platform?.activeUsers === 'number' ? platform.activeUsers : null,
          searchVolume: typeof platform?.monthlySearchesRaw === 'number' ? platform.monthlySearchesRaw : null,
          syncSuccessRate: 0,
          retryCount: 0,
          cacheHitRatio: 0,
          latencyP50: null,
          latencyP95: null,
        }

        setStats(combined)
        setFreshness(fresh.rows || [])
      } catch {
        setError('Failed to load analytics stats')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Platform Analytics</h1>
            <p className="text-xl text-muted-foreground">
              Comprehensive judicial data insights and trends across California courts
            </p>
          </div>

          {/* Live Thin Dashboard */}
          <StatCards stats={stats} loading={loading} />

          {error && <div className="text-sm text-red-500 mt-4">{error}</div>}

          <div className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Last sync: {stats && stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString() : '—'}
          </div>

          <OperationalMetrics stats={stats} />
          <p className="mt-4 text-xs text-muted-foreground">
            Need more context? Review our <Link href="/docs/methodology" className="text-primary underline-offset-4 hover:text-foreground">methodology</Link>{' '}
            and <Link href="/docs/governance" className="text-primary underline-offset-4 hover:text-foreground">governance</Link> guides.
          </p>

          {/* Freshness table */}
          <FreshnessTable freshness={freshness} />

            <div className="mt-8">
              <Link 
                href="/judges"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Explore Judge Profiles
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
