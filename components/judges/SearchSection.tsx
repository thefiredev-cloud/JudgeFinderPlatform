'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Building, Filter, Users, Scale, Clock, ChevronRight } from 'lucide-react'
import type { SearchResult } from '@/types/search'

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
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Fetch search suggestions
  const fetchSearchResults = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Effect for debounced search
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      fetchSearchResults(debouncedSearchQuery)
    } else {
      setSearchResults([])
      setShowSuggestions(false)
    }
  }, [debouncedSearchQuery, fetchSearchResults])

  // Handle search submission
  const handleSearch = useCallback((query?: string, directUrl?: string) => {
    const searchTerm = query || searchQuery.trim()
    
    if (directUrl) {
      router.push(directUrl)
    } else if (searchTerm) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
    }
    
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }, [searchQuery, router])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || searchResults.length === 0) {
      if (e.key === 'Enter') {
        handleSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : -1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > -1 ? prev - 1 : searchResults.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          const selectedResult = searchResults[selectedIndex]
          handleSearch(selectedResult.title, selectedResult.url)
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        searchRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'judge':
        return <Scale className="h-4 w-4 text-blue-500" />
      case 'court':
        return <Building className="h-4 w-4 text-green-500" />
      case 'jurisdiction':
        return <MapPin className="h-4 w-4 text-purple-500" />
      default:
        return <Search className="h-4 w-4 text-gray-500" />
    }
  }

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case 'judge':
        return 'Judge'
      case 'court':
        return 'Court'
      case 'jurisdiction':
        return 'Jurisdiction'
      default:
        return 'Result'
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchQuery.trim() && searchResults.length > 0) {
                setShowSuggestions(true)
              }
            }}
            placeholder="Search judges, courts, or jurisdictions..."
            className="w-full rounded-lg border border-gray-700 bg-gray-800 py-4 pl-12 pr-20 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button 
            onClick={() => handleSearch()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && (searchResults.length > 0 || isLoading) && (
          <div 
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 shadow-xl"
          >
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                <span className="ml-2 text-gray-300">Searching...</span>
              </div>
            ) : (
              <>
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSearch(result.title, result.url)}
                    className={`w-full text-left p-4 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 ${
                      index === selectedIndex ? 'bg-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {getResultIcon(result.type)}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-white truncate">{result.title}</h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                              {getResultTypeLabel(result.type)}
                            </span>
                          </div>
                          {result.subtitle && (
                            <p className="text-sm text-gray-400 truncate">{result.subtitle}</p>
                          )}
                          {result.description && (
                            <p className="text-xs text-gray-500 truncate mt-1">{result.description}</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </button>
                ))}
                
                {searchResults.length > 0 && (
                  <button
                    onClick={() => handleSearch()}
                    className="w-full p-4 text-center text-blue-400 hover:bg-gray-700 transition-colors border-t border-gray-700"
                  >
                    View all results for "{searchQuery}" →
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick Search Categories */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => handleSearch('', '/judges')}
          className="group p-6 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-left"
        >
          <div className="flex items-center space-x-3 mb-2">
            <Scale className="h-6 w-6 text-blue-500" />
            <h3 className="font-semibold text-white">Browse Judges</h3>
          </div>
          <p className="text-sm text-gray-400">
            Explore judicial profiles, case history, and ruling patterns
          </p>
        </button>

        <button
          onClick={() => handleSearch('', '/courts')}
          className="group p-6 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-left"
        >
          <div className="flex items-center space-x-3 mb-2">
            <Building className="h-6 w-6 text-green-500" />
            <h3 className="font-semibold text-white">Find Courts</h3>
          </div>
          <p className="text-sm text-gray-400">
            Discover court information, locations, and judicial assignments
          </p>
        </button>

        <button
          onClick={() => handleSearch('', '/jurisdictions')}
          className="group p-6 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-left"
        >
          <div className="flex items-center space-x-3 mb-2">
            <MapPin className="h-6 w-6 text-purple-500" />
            <h3 className="font-semibold text-white">Explore Jurisdictions</h3>
          </div>
          <p className="text-sm text-gray-400">
            Navigate federal, state, and local judicial systems
          </p>
        </button>
      </div>

      {/* Popular Searches */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400 mb-4">Popular searches:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { term: 'California Superior Court', type: 'court' },
            { term: 'Los Angeles County', type: 'jurisdiction' },
            { term: 'Federal Court', type: 'court' },
            { term: 'Orange County', type: 'jurisdiction' }
          ].map(({ term, type }) => (
            <button
              key={term}
              onClick={() => handleSearch(term)}
              className="rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-blue-500 hover:text-blue-400 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}