'use client'

import Link from 'next/link'
import { Building, Users, TrendingUp, ArrowRight, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

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
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Top California Courts</h2>
        <Link href="/courts" className="flex items-center text-blue-400 hover:text-blue-300">
          View all courts
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <span className="ml-2 text-gray-400">Loading top courts...</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courts.map((court) => (
            <Link
              key={court.id}
              href={`/courts/${court.slug}`}
              className="group rounded-lg border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-blue-600/50 hover:bg-gray-900"
            >
              <div className="mb-4 flex items-center justify-between">
                <Building className="h-8 w-8 text-blue-400" />
                <span className={`flex items-center text-sm ${
                  court.yearly_trend.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {court.yearly_trend}
                </span>
              </div>
              <h3 className="mb-2 font-semibold group-hover:text-blue-400 text-sm leading-tight">{court.name}</h3>
              <p className="mb-3 text-sm text-gray-400 capitalize">{court.type} Court</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center">
                  <Users className="mr-1 h-3 w-3" />
                  {court.judge_count} judges
                </span>
                <span className="text-right">{formatCaseCount(court.cases_per_year)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}