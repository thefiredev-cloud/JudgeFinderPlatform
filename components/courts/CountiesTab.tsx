'use client'

import { useEffect, useState } from 'react'
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {counties.map((c, index) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 * index }}
          >
            <Link
              href={`/jurisdictions/${toSlug(c.name)}`}
              className="group block rounded-lg border border-border p-4 transition-all hover:border-primary/40 hover:shadow-lg bg-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {c.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {c.judgeCount.toLocaleString()} judges
                  </p>
                </div>
                <MapPin className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default CountiesTab


