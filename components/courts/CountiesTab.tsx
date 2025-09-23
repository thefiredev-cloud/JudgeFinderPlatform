'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { MapPin, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface CountyItem {
  name: string
  judgeCount: number
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
}

export function CountiesTab() {
  const [counties, setCounties] = useState<CountyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchCountsByJurisdiction() {
      try {
        setLoading(true)
        setError(null)

        // Use lightweight counts endpoint
        const res = await fetch('/api/jurisdictions/counts')
        if (!res.ok) throw new Error(`Failed to load counts: ${res.status}`)
        const data = await res.json()

        const items: CountyItem[] = (data.counts as Array<{ jurisdiction: string; judge_count: number }> | undefined)?.map(
          (row) => ({ name: row.jurisdiction, judgeCount: row.judge_count })
        )?.sort((a, b) => a.name.localeCompare(b.name)) ?? []

        if (isMounted) setCounties(items)
      } catch (e) {
        if (isMounted) setError('Failed to load counties')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchCountsByJurisdiction()
    return () => { isMounted = false }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q ? counties.filter(c => c.name.toLowerCase().includes(q)) : counties
    return [...base].sort((a, b) => a.name.localeCompare(b.name))
  }, [counties, query])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
        <span className="text-sm text-muted-foreground">Loading counties…</span>
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search counties..."
          className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filtered.map((c, index) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(0.003 * index, 0.2) }}
          >
            <Link
              href={`/jurisdictions/${toSlug(c.name)}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary/40 hover:text-primary transition-colors"
            >
              <MapPin className="h-4 w-4" />
              <span className="font-medium">{c.name}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default CountiesTab


