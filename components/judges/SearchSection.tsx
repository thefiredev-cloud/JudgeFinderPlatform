'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
        return <Scale className="h-4 w-4 text-primary" />
      case 'court':
        return <Building className="h-4 w-4 text-primary" />
      case 'jurisdiction':
        return <MapPin className="h-4 w-4 text-primary" />
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />
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
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
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
            className="w-full rounded-lg border border-border bg-card py-4 pl-12 pr-20 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-300"
          />
          <motion.button 
            onClick={() => handleSearch()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-primary px-6 py-2 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Search
          </motion.button>
        </motion.div>

        {/* Search Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && (searchResults.length > 0 || isLoading) && (
            <motion.div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-border bg-card shadow-xl"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span className="ml-2 text-muted-foreground">Searching...</span>
              </div>
            ) : (
              <>
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSearch(result.title, result.url)}
                    className={`w-full text-left p-4 hover:bg-muted transition-colors border-b border-border last:border-b-0 ${
                      index === selectedIndex ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {getResultIcon(result.type)}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-foreground truncate">{result.title}</h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              {getResultTypeLabel(result.type)}
                            </span>
                          </div>
                          {result.subtitle && (
                            <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                          )}
                          {result.description && (
                            <p className="text-xs text-muted-foreground/70 truncate mt-1">{result.description}</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </button>
                ))}
                
                {searchResults.length > 0 && (
                  <button
                    onClick={() => handleSearch()}
                    className="w-full p-4 text-center text-primary hover:bg-muted transition-colors border-t border-border"
                  >
                    View all results for "{searchQuery}" →
                  </button>
                )}
              </>
            )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Search Categories */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.button
          onClick={() => handleSearch('', '/judges')}
          className="group relative p-6 rounded-lg border border-border bg-card hover:bg-muted transition-all duration-300 text-left overflow-hidden"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center space-x-3 mb-2">
            <Scale className="h-6 w-6 text-primary" />
            <h3 className="font-semibold text-foreground">Browse Judges</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Explore judicial profiles, case history, and ruling patterns
          </p>
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-enterprise-primary to-enterprise-deep opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
        </motion.button>

        <motion.button
          onClick={() => handleSearch('', '/courts')}
          className="group relative p-6 rounded-lg border border-border bg-card hover:bg-muted transition-all duration-300 text-left overflow-hidden"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center space-x-3 mb-2">
            <Building className="h-6 w-6 text-primary" />
            <h3 className="font-semibold text-foreground">Find Courts</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Discover court information, locations, and judicial assignments
          </p>
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-enterprise-primary to-enterprise-deep opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
        </motion.button>

        <motion.button
          onClick={() => handleSearch('', '/jurisdictions')}
          className="group relative p-6 rounded-lg border border-border bg-card hover:bg-muted transition-all duration-300 text-left overflow-hidden"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center space-x-3 mb-2">
            <MapPin className="h-6 w-6 text-primary" />
            <h3 className="font-semibold text-foreground">Explore Jurisdictions</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Navigate federal, state, and local judicial systems
          </p>
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-enterprise-primary to-enterprise-deep opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
        </motion.button>
      </div>

      {/* Popular Searches */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">Popular searches:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { term: 'California Superior Court', type: 'court', url: '/search?q=California%20Superior%20Court&type=court' },
            { term: 'Los Angeles County', type: 'jurisdiction', url: '/jurisdictions/los-angeles-county' },
            { term: 'Federal Court', type: 'court', url: '/search?q=Federal%20Court&type=court' },
            { term: 'Orange County', type: 'jurisdiction', url: '/jurisdictions/orange-county' }
          ].map(({ term, type, url }, index) => (
            <motion.button
              key={term}
              onClick={() => router.push(url)}
              className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all duration-300"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {term}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}