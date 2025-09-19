 'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BarChart3, ArrowLeft, Clock, Database, RefreshCcw } from 'lucide-react'

export const dynamic = 'force-dynamic'

type DashboardStats = {
  totalJudges: number
  totalCourts: number
  totalCases: number
  pendingSync: number
  lastSyncTime: string | null
  systemHealth: 'healthy' | 'warning' | 'error'
  activeUsers: number
  searchVolume: number
  syncSuccessRate: number
  retryCount: number
  cacheHitRatio: number
  latencyP50: number | null
  latencyP95: number | null
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [freshness, setFreshness] = useState<Array<{ court_id: string; court_name: string; last_update: string | null }>>([])

  const formatPercent = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '—'
    return `${value.toFixed(1)}%`
  }

  const formatLatency = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '—'
    return `${Math.round(value)} ms`
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [adminRes, freshRes] = await Promise.all([
          fetch('/api/admin/stats', { cache: 'no-store' }),
          fetch('/api/stats/freshness-by-court', { cache: 'no-store' })
        ])
        if (!adminRes.ok) {
          throw new Error('Failed to load platform statistics')
        }

        const [adminStats, fresh] = await Promise.all([
          adminRes.json(),
          freshRes.json(),
        ])

        setStats(adminStats as DashboardStats)
        setFreshness(fresh.rows || [])
      } catch (e: any) {
        setError('Failed to load analytics stats')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>

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
          <div className="bg-card rounded-lg border border-border p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Coverage & Freshness</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading…' : 'Updated'}
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-500 mb-4">{error}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg border border-border bg-background">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Database className="h-4 w-4" />
                  Total Judges
                </div>
                <div className="text-3xl font-bold">
                  {stats?.totalJudges ?? '—'}
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-background">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Database className="h-4 w-4" />
                  Case Records
                </div>
                <div className="text-3xl font-bold">
                  {stats?.totalCases ? stats.totalCases.toLocaleString() : '—'}
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-background">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Database className="h-4 w-4" />
                  CA Courts
                </div>
                <div className="text-3xl font-bold">
                  {stats?.totalCourts ?? '—'}
                </div>
              </div>
            </div>

          <div className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Last sync: {stats?.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString() : '—'}
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-xl font-semibold text-foreground">Operational metrics (last 24h)</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="text-sm text-muted-foreground">Sync success</div>
                <div className="mt-2 text-2xl font-semibold">
                  {stats ? formatPercent(stats.syncSuccessRate) : '—'}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Retry attempts: {stats ? stats.retryCount.toLocaleString() : '—'}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="text-sm text-muted-foreground">Pending jobs</div>
                <div className="mt-2 text-2xl font-semibold">
                  {stats ? stats.pendingSync.toLocaleString() : '—'}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Active users: {stats ? stats.activeUsers.toLocaleString() : '—'}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="text-sm text-muted-foreground">Cache hit ratio</div>
                <div className="mt-2 text-2xl font-semibold">
                  {stats ? formatPercent(stats.cacheHitRatio) : '—'}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Lookup volume: {stats?.searchVolume ? stats.searchVolume.toLocaleString() : '—'}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="text-sm text-muted-foreground">Latency (p50 / p95)</div>
                <div className="mt-2 text-2xl font-semibold">
                  {stats ? formatLatency(stats.latencyP50) : '—'}
                  <span className="text-sm text-muted-foreground"> / {stats ? formatLatency(stats.latencyP95) : '—'}</span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Need more context? Review our <Link href="/docs/methodology" className="text-[color:hsl(var(--accent))] underline-offset-4 hover:text-[color:hsl(var(--text-1))]">methodology</Link>{' '}
              and <Link href="/docs/governance" className="text-[color:hsl(var(--accent))] underline-offset-4 hover:text-[color:hsl(var(--text-1))]">governance</Link> guides.
            </p>
          </div>

          {/* Freshness table */}
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
