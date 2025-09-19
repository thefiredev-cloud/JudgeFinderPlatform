'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Building, Users, TrendingUp, ArrowRight, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

import { resolveCourtSlug } from '@/lib/utils/slug'

interface Court {
  id: string
  name: string
  type: string
  jurisdiction: string
  judge_count: number
  cases_per_year: number
  yearly_trend: string
  slug: string
}

interface TopCourtsResponse {
  courts: Court[]
  data_source: string
  message: string
}

export function PopularCourts() {
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTopCourts() {
      try {
        setLoading(true)
        const response = await fetch('/api/courts/top-by-cases')
        if (!response.ok) {
          throw new Error('Failed to fetch courts')
        }
        const data: TopCourtsResponse = await response.json()
        setCourts(data.courts)
      } catch (err) {
        console.error('Error fetching courts:', err)
        setError('Failed to load courts')
      } finally {
        setLoading(false)
      }
    }

    fetchTopCourts()
  }, [])

  const formatCaseCount = (count: number) => {
    if (count >= 1000) {
      return `${Math.round(count / 1000).toLocaleString()}k+ cases/year`
    }
    return `${count.toLocaleString()} cases/year`
  }

  return (
    <div>
      <motion.div 
        className="mb-8 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold">Top California Courts</h2>
        <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
          <Link href="/courts" className="flex items-center text-primary hover:text-primary/80">
            View all courts
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </motion.div>
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            className="flex items-center justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="loading"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading top courts...</span>
          </motion.div>
        ) : error ? (
          <motion.div 
            className="rounded-lg border border-destructive bg-destructive/20 p-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key="error"
          >
            <p className="text-destructive">{error}</p>
          </motion.div>
        ) : (
          <motion.div 
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            key="courts"
          >
            {courts.map((court, index) => (
              <motion.div
                key={court.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={`/courts/${resolveCourtSlug(court) || court.id}`}
                  className="group relative block rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50 hover:bg-muted overflow-hidden"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <Building className="h-8 w-8 text-primary" />
                    <span className={`flex items-center text-sm ${
                      court.yearly_trend.startsWith('+') ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <TrendingUp className="mr-1 h-3 w-3" />
                      {court.yearly_trend}
                    </span>
                  </div>
                  <h3 className="mb-2 font-semibold group-hover:text-primary text-sm leading-tight">{court.name}</h3>
                  <p className="mb-3 text-sm text-muted-foreground capitalize">{court.type} Court</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Users className="mr-1 h-3 w-3" />
                      {court.judge_count} judges
                    </span>
                    <span className="text-right">{formatCaseCount(court.cases_per_year)}</span>
                  </div>
                  {/* Animated gradient overlay on hover */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-enterprise-primary to-enterprise-deep opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
