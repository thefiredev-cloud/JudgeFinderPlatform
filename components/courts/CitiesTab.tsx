'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { MapPin, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface CityItem {
  city: string
  jurisdiction: string
  court_count: number
}

function toSlugCity(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
}

export function CitiesTab() {
  const [items, setItems] = useState<CityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let mounted = true
    async function run() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/jurisdictions/cities')
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const data = await res.json()
        if (mounted) setItems(data.cities ?? [])
      } catch (e) {
        if (mounted) setError('Failed to load cities')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q
      ? items.filter(i => i.city.toLowerCase().includes(q))
      : items
    return [...base].sort((a, b) => a.city.localeCompare(b.city))
  }, [items, query])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
        <span className="text-sm text-muted-foreground">Loading cities…</span>
      </div>
    )
  }

  if (error) return <div className="text-sm text-destructive">{error}</div>

  return (
    <div className="space-y-4">
      <div className="relative max-w-md mx-auto">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cities..."
          className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex flex-wrap gap-2 unstyled-list justify-center">
        {filtered.map((c, idx) => (
          <motion.div key={`${c.city}-${idx}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.003, 0.2) }}>
            <Link
              href={`/cities/${toSlugCity(c.city)}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary/40 hover:text-primary transition-colors"
            >
              <MapPin className="h-4 w-4" />
              <span className="font-medium">{c.city}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default CitiesTab


