'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CourtJudgesSection from '@/components/courts/CourtJudgesSection'

interface Court {
  id: string
  name: string
  type: string
  jurisdiction: string
  address?: string | null
  phone?: string | null
  website?: string | null
  judge_count?: number | null
}

export function CourtClientFallback({ slug }: { slug: string }) {
  const [court, setCourt] = useState<Court | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialJudges, setInitialJudges] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/courts/by-slug?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`court ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        const c: Court | null = data?.court || null
        setCourt(c)
        if (c) {
          const jr = await fetch(`/api/courts/${c.id}/judges?limit=5&page=1`, { cache: 'no-store' })
          if (jr.ok) {
            const jd = await jr.json()
            if (!cancelled) {
              setInitialJudges(jd.judges || [])
              setTotalCount(jd.total_count || 0)
            }
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load court')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-2">Loading court…</h1>
        <p className="text-muted-foreground">Fetching latest details.</p>
      </div>
    )
  }

  if (error || !court) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-2">Court Not Found</h1>
        <p className="text-muted-foreground mb-6">Please try again or browse all courts.</p>
        <Link href="/courts" className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg">Back to Courts</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-1">{court.name}</h1>
        <p className="text-muted-foreground capitalize">{court.type} Court • {court.jurisdiction}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <CourtJudgesSection courtId={court.id} courtName={court.name} initialJudges={initialJudges} />
        </div>
        <div>
          <div className="bg-card rounded-xl shadow p-6 border border-border">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <Link href={`/judges?court=${encodeURIComponent(court.name)}`} className="block w-full text-center bg-primary text-primary-foreground px-4 py-2 rounded-lg">
              Browse {totalCount || court.judge_count || 0} Judges
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourtClientFallback


