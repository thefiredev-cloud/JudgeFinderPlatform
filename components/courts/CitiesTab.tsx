'use client'

import { useEffect, useState } from 'react'
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((c, idx) => (
        <motion.div key={`${c.city}-${idx}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.01 }}>
          <Link href={`/search?city=${encodeURIComponent(c.city)}`} className="group block rounded-lg border border-border p-4 bg-card hover:border-primary/40 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{c.city}</h3>
                <p className="text-sm text-muted-foreground">{c.court_count} courts</p>
              </div>
              <MapPin className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

export default CitiesTab


