"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User, MapPin, Building } from 'lucide-react'

interface Judge {
  id: string
  name: string
  slug: string
  court_name: string
  jurisdiction: string
  appointed_date?: string
}

interface RelatedJudgesProps {
  currentJudgeId: string
  courtName: string
  jurisdiction: string
  judgeName: string
}

export function RelatedJudges({ currentJudgeId, courtName, jurisdiction, judgeName }: RelatedJudgesProps) {
  const [relatedJudges, setRelatedJudges] = useState<Judge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRelatedJudges() {
      try {
        const response = await fetch(
          `/api/judges/related?judgeId=${currentJudgeId}&court=${encodeURIComponent(courtName)}&jurisdiction=${encodeURIComponent(jurisdiction)}&limit=6`
        )
        
        if (response.ok) {
          const data = await response.json()
          setRelatedJudges(data.judges || [])
        }
      } catch (error) {
        console.error('Error fetching related judges:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedJudges()
  }, [currentJudgeId, courtName, jurisdiction])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (relatedJudges.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <User className="h-5 w-5 text-blue-600 mr-2" />
        Other Judges You May Research
      </h2>
      
      <div className="space-y-4">
        {relatedJudges.map((judge) => (
          <Link
            key={judge.id}
            href={`/judges/${judge.slug}`}
            className="block group hover:bg-gray-50 rounded-lg p-3 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  Judge {judge.name}
                </h3>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span className="flex items-center">
                    <Building className="h-3 w-3 mr-1" />
                    {judge.court_name}
                  </span>
                  {judge.appointed_date && (
                    <span className="text-gray-500">
                      Since {new Date(judge.appointed_date).getFullYear()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Link
            href={`/courts/${courtName.toLowerCase().replace(/\s+/g, '-')}`}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Building className="h-4 w-4 mr-2" />
            View All {courtName} Judges
          </Link>
          <Link
            href={`/jurisdictions/${jurisdiction.toLowerCase().replace(/\s+/g, '-')}`}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {jurisdiction} Court Directory
          </Link>
        </div>
      </div>

      {/* SEO Internal Links */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 leading-relaxed">
          Research judicial patterns and find experienced attorneys in {jurisdiction}. Compare {judgeName}'s 
          ruling history with other {courtName} judges. Access comprehensive legal analytics for case strategy 
          and attorney selection in {jurisdiction} courts.
        </p>
      </div>
    </div>
  )
}