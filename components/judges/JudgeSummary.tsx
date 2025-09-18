"use client"
import { useEffect, useState } from 'react'

type JudgeProfile = {
  judge_id: string
  full_name: string
  court_name: string | null
  jurisdiction: string
  last_updated: string
}

type MotionStat = { motion_type: string; grant_rate: number; n: number }

export function JudgeSummary({ judgeId, apiKey }: { judgeId: string; apiKey?: string }) {
  const [profile, setProfile] = useState<JudgeProfile | null>(null)
  const [motions, setMotions] = useState<MotionStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const headers: Record<string, string> = {}
    if (apiKey) headers['x-api-key'] = apiKey
    Promise.all([
      fetch(`/api/v1/judges/${judgeId}`, { headers }).then(r => r.json()),
      fetch(`/api/v1/judges/${judgeId}/analytics/motions`, { headers }).then(r => r.json())
    ])
      .then(([p, m]) => {
        setProfile(p)
        setMotions((m?.motions || []).slice(0, 3))
      })
      .catch(() => setError('Failed to load judge summary'))
      .finally(() => setLoading(false))
  }, [judgeId, apiKey])

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>
  if (error) return <div className="text-sm text-red-500">{error}</div>
  if (!profile) return null

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="text-lg font-semibold">{profile.full_name}</div>
      <div className="text-sm text-muted-foreground">{profile.court_name || '—'} • {profile.jurisdiction}</div>
      <div className="mt-3">
        <div className="text-sm font-medium mb-1">Motions (top 3)</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {motions.map(m => (
            <div key={m.motion_type} className="text-sm p-2 rounded border border-border bg-background">
              <div className="font-medium">{m.motion_type}</div>
              <div className="text-muted-foreground">{m.grant_rate}% • n={m.n}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">Updated {new Date(profile.last_updated).toLocaleDateString()}</div>
    </div>
  )
}

export default JudgeSummary


