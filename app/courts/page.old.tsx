'use client'

import { useState, useEffect } from 'react'
import { Building, MapPin, Users, Scale, Search, Loader2 } from 'lucide-react'
import Link from 'next/link'

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

export default function CourtsPage() {
  const [selectedType, setSelectedType] = useState('')
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('CA')
  const [searchQuery, setSearchQuery] = useState('')
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchCourts = async (page = 1, reset = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      
      if (searchQuery.trim()) params.append('q', searchQuery)
      if (selectedType) params.append('type', selectedType)
      if (selectedJurisdiction) params.append('jurisdiction', selectedJurisdiction)

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
  }, [searchQuery, selectedType, selectedJurisdiction])

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
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Courts Directory</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover courts across all jurisdictions and explore detailed information about judicial systems nationwide
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Find Courts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Court Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="federal">Federal Courts</option>
                <option value="state">State Courts</option>
                <option value="local">Local Courts</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jurisdiction</label>
              <select
                value={selectedJurisdiction}
                onChange={(e) => setSelectedJurisdiction(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Jurisdictions</option>
                <option value="FB">Federal Bankruptcy</option>
                <option value="FD">Federal District</option>
                <option value="F">Federal Circuit</option>
                <option value="CA">California</option>
                <option value="TX">Texas</option>
              </select>
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
                  `Found ${totalCount} courts matching your criteria`
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
            <p className="text-gray-600">Try adjusting your search filters.</p>
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
    </div>
  )
}
