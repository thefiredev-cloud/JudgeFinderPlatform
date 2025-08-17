'use client'

import { useState, useEffect } from 'react'
import { Building, MapPin, Users, Scale, Search, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Court {
  id: string
  name: string
  type: string
  jurisdiction: string
  address?: string | number
  phone?: string
  website?: string
  judge_count: number
}

interface CourtsResponse {
  courts: Court[]
  total_count: number
  page: number
  per_page: number
  has_more: boolean
}

// Map slugs to display names and jurisdiction values
const jurisdictionMap: Record<string, { displayName: string; jurisdictionValue: string; description: string }> = {
  'los-angeles-county': {
    displayName: 'Los Angeles County',
    jurisdictionValue: 'CA', // Most CA county courts use 'CA' as jurisdiction
    description: 'Largest judicial system in California with comprehensive trial and appellate courts.'
  },
  'orange-county': {
    displayName: 'Orange County',
    jurisdictionValue: 'Orange County, CA', // Some specific county courts use full name
    description: 'Major Southern California jurisdiction serving diverse communities and businesses.'
  },
  'san-diego-county': {
    displayName: 'San Diego County',
    jurisdictionValue: 'CA',
    description: 'Southern California coastal jurisdiction with federal and state court systems.'
  },
  'san-francisco-county': {
    displayName: 'San Francisco County',
    jurisdictionValue: 'CA',
    description: 'Metropolitan jurisdiction with specialized business and technology courts.'
  },
  'santa-clara-county': {
    displayName: 'Santa Clara County',
    jurisdictionValue: 'CA',
    description: 'Silicon Valley jurisdiction handling technology and intellectual property cases.'
  },
  'alameda-county': {
    displayName: 'Alameda County',
    jurisdictionValue: 'CA',
    description: 'Bay Area jurisdiction with diverse civil and criminal caseloads.'
  },
  'california': {
    displayName: 'California',
    jurisdictionValue: 'CA',
    description: 'State courts across California handling various civil and criminal matters.'
  },
  'federal': {
    displayName: 'Federal',
    jurisdictionValue: 'F',
    description: 'Federal courts handling federal matters across California districts.'
  },
  'texas': {
    displayName: 'Texas',
    jurisdictionValue: 'TX',
    description: 'Texas state courts and federal courts in Texas jurisdictions.'
  }
}

export default function CountyCourtsPage() {
  const params = useParams()
  const county = params.county as string
  const [searchQuery, setSearchQuery] = useState('')
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Get jurisdiction info
  const jurisdictionInfo = jurisdictionMap[county]
  
  if (!jurisdictionInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Jurisdiction Not Found</h1>
          <p className="text-gray-600 mb-6">The requested jurisdiction could not be found.</p>
          <Link 
            href="/jurisdictions"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            ← Back to Jurisdictions
          </Link>
        </div>
      </div>
    )
  }

  const fetchCourts = async (page = 1, reset = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        jurisdiction: jurisdictionInfo.jurisdictionValue
      })
      
      if (searchQuery.trim()) params.append('q', searchQuery)

      const response = await fetch(`/api/courts?${params}`)
      if (!response.ok) throw new Error('Failed to fetch courts')
      
      const data: CourtsResponse = await response.json()
      
      if (reset || page === 1) {
        setCourts(data.courts)
      } else {
        setCourts(prev => [...prev, ...data.courts])
      }
      
      setTotalCount(data.total_count)
      setCurrentPage(data.page)
      setHasMore(data.has_more)
    } catch (error) {
      console.error('Error fetching courts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourts(1, true)
  }, [searchQuery, county])

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchCourts(currentPage + 1, false)
    }
  }

  const generateSlug = (court: Court) => {
    return court.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const getLocationDisplay = (court: Court) => {
    if (court.address && typeof court.address === 'string') {
      return court.address
    }
    // Extract location from court name if address not available
    const nameMatch = court.name.match(/(.*?),\s*([A-Z]{2}\.?\s*[A-Za-z]*)/);
    if (nameMatch) {
      return nameMatch[2];
    }
    return court.jurisdiction || 'Location not specified'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-6">
            <Link 
              href="/jurisdictions"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Jurisdictions
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {jurisdictionInfo.displayName} Courts
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
              {jurisdictionInfo.description}
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {totalCount > 0 && (
                <span className="rounded-lg bg-blue-600 px-3 py-1 text-white">
                  {totalCount} Courts
                </span>
              )}
              {courts.length > 0 && (
                <span className="rounded-lg bg-green-600 px-3 py-1 text-white">
                  {courts.reduce((sum, court) => sum + (court.judge_count || 0), 0)} Judges
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Search Courts in {jurisdictionInfo.displayName}</h2>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Courts</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by court name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Results Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading courts...
                  </div>
                ) : (
                  `Found ${totalCount} courts in ${jurisdictionInfo.displayName}`
                )}
              </div>
              {!loading && totalCount > 0 && (
                <div className="text-sm text-blue-600">
                  Showing {courts.length} of {totalCount}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Courts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading && courts.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Loading courts...</p>
          </div>
        ) : courts.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courts found</h3>
            <p className="text-gray-600">
              {searchQuery.trim() 
                ? `No courts found matching "${searchQuery}" in ${jurisdictionInfo.displayName}` 
                : `No courts found in ${jurisdictionInfo.displayName}`
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courts.map((court) => (
                <Link
                  key={court.id}
                  href={`/courts/${generateSlug(court)}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-6 group border border-gray-100 hover:border-blue-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Building className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors" />
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded capitalize">
                      {court.type}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {court.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{getLocationDisplay(court)}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      {court.judge_count || 0} judges
                    </div>
                    <div className="flex items-center">
                      <Scale className="h-4 w-4 mr-2 text-gray-400" />
                      {court.jurisdiction} jurisdiction
                    </div>
                    {court.website && (
                      <div className="pt-2">
                        <span className="text-xs text-blue-600 hover:text-blue-800">
                          Visit website →
                        </span>
                      </div>
                    )}
                    <div className="pt-2">
                      <span className="text-xs text-blue-600 hover:text-blue-800">
                        View court details →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Load More Courts'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Explore More</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href={`/judges?jurisdiction=${encodeURIComponent(jurisdictionInfo.jurisdictionValue)}`}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View All {jurisdictionInfo.displayName} Judges
              </Link>
              <Link
                href="/jurisdictions"
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Browse Other Jurisdictions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}