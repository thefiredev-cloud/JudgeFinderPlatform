import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BarChart3, ArrowLeft, Clock, Database, RefreshCcw } from 'lucide-react'

export const dynamic = 'force-dynamic'

type DashboardStats = {
  judges: { totalJudges: number; lastUpdate: string }
  courts: { totalCourts: number }
  cases: { totalCases: number }
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [freshness, setFreshness] = useState<Array<{ court_id: string; court_name: string; last_update: string | null }>>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [judgesRes, courtsRes, casesRes, freshRes] = await Promise.all([
          fetch('/api/stats/judges', { cache: 'no-store' }),
          fetch('/api/stats/courts', { cache: 'no-store' }),
          fetch('/api/stats/cases', { cache: 'no-store' }),
          fetch('/api/stats/freshness-by-court', { cache: 'no-store' })
        ])
        const [judges, courts, cases, fresh] = await Promise.all([
          judgesRes.json(),
          courtsRes.json(),
          casesRes.json(),
          freshRes.json()
        ])
        setStats({
          judges: { totalJudges: judges.totalJudges, lastUpdate: judges.lastUpdate },
          courts: { totalCourts: courts.totalCourts },
          cases: { totalCases: cases.totalCases }
        })
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
                  {stats?.judges.totalJudges ?? '—'}
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-background">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Database className="h-4 w-4" />
                  Case Records
                </div>
                <div className="text-3xl font-bold">
                  {stats?.cases.totalCases ? stats.cases.totalCases.toLocaleString() : '—'}
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-background">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Database className="h-4 w-4" />
                  CA Courts
                </div>
                <div className="text-3xl font-bold">
                  {stats?.courts.totalCourts ?? '—'}
                </div>
              </div>
            </div>

            <div className="mt-6 text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last updated: {stats?.judges.lastUpdate ? new Date(stats.judges.lastUpdate).toLocaleString() : '—'}
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