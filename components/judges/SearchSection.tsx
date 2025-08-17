'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Building, Filter } from 'lucide-react'

// Debounce hook for performance optimization
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function SearchSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [jurisdiction, setJurisdiction] = useState('')
  const [courtType, setCourtType] = useState('')
  const [caseSpecialization, setCaseSpecialization] = useState('')
  const router = useRouter()

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams()
    if (debouncedSearchQuery.trim()) params.set('q', debouncedSearchQuery.trim())
    if (jurisdiction) params.set('jurisdiction', jurisdiction)
    if (courtType) params.set('court_type', courtType)
    if (caseSpecialization) params.set('specialization', caseSpecialization)
    
    router.push(`/judges?${params.toString()}`)
  }, [debouncedSearchQuery, jurisdiction, courtType, caseSpecialization, router])

  // Auto-search when filters change
  useEffect(() => {
    if (debouncedSearchQuery.trim() || jurisdiction || courtType || caseSpecialization) {
      handleSearch()
    }
  }, [debouncedSearchQuery, jurisdiction, courtType, caseSpecialization, handleSearch])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by judge name, court, or case type..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-4 text-gray-300 hover:bg-gray-700"
          >
            <Filter className="h-5 w-5" />
          </button>
          <button 
            onClick={handleSearch}
            className="rounded-lg bg-blue-600 px-8 py-4 font-semibold text-white hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        {/* Quick Filters */}
        {showFilters && (
          <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800 p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Jurisdiction
                </label>
                <select 
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Jurisdictions</option>
                  <option value="Federal">Federal</option>
                  <option value="California">California</option>
                  <option value="New York">New York</option>
                  <option value="Texas">Texas</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  <Building className="inline h-4 w-4 mr-1" />
                  Court Type
                </label>
                <select 
                  value={courtType}
                  onChange={(e) => setCourtType(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Courts</option>
                  <option value="supreme">Supreme Court</option>
                  <option value="appeals">Appeals Court</option>
                  <option value="district">District Court</option>
                  <option value="superior">Superior Court</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Case Specialization
                </label>
                <select 
                  value={caseSpecialization}
                  onChange={(e) => setCaseSpecialization(e.target.value)}
                  className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Types</option>
                  <option value="civil">Civil Litigation</option>
                  <option value="criminal">Criminal</option>
                  <option value="family">Family Law</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Suggestions */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">Popular searches:</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {['Judge Sarah Johnson', 'California Superior Court', 'Patent Cases', 'Criminal Defense'].map(
            (term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term)
                  handleSearch()
                }}
                className="rounded-full border border-gray-700 px-3 py-1 text-sm text-gray-300 hover:border-blue-500 hover:text-blue-400 cursor-pointer"
              >
                {term}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}