'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, Scale, Building, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { SearchResult } from '@/types/search'

interface UnifiedSearchProps {
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

// Debounce hook
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

const UnifiedSearch: React.FC<UnifiedSearchProps> = ({
  placeholder = "Enter your judge's name...",
  className = "",
  autoFocus = false
}) => {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Debounce search query
  const debouncedQuery = useDebounce(query, 300)

  const handleSearch = () => {
    if (!query.trim()) return

    // Route to search results page for full search
    const searchQuery = query.trim()
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
  }

  const handleSelectResult = (result: SearchResult) => {
    // Navigate directly to the result's URL
    router.push(result.url)
    setQuery('')
    setSearchResults([])
    setIsFocused(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'judge':
        return <Scale className="w-4 h-4 text-blue-500" />
      case 'court':
        return <Building className="w-4 h-4 text-green-500" />
      case 'jurisdiction':
        return <MapPin className="w-4 h-4 text-purple-500" />
      default:
        return <Search className="w-4 h-4 text-gray-400" />
    }
  }

  // Fetch real search results from API
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/judges/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data.results || [])
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSearchResults()
  }, [debouncedQuery])

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className={`
          relative flex items-center w-full
          bg-white dark:bg-gray-800
          rounded-xl lg:rounded-2xl shadow-lg
          border-2 transition-all duration-200
          min-h-[52px] lg:min-h-[56px]
          ${isFocused
            ? 'border-blue-500 shadow-xl lg:scale-[1.02]'
            : 'border-gray-200 dark:border-gray-700'
          }
        `}
      >
        {/* Search Icon */}
        <button
          onClick={handleSearch}
          className="pl-4 pr-3 py-3 lg:pl-5 lg:pr-3 touch-target"
          aria-label="Search"
        >
          <Search
            className={`w-5 h-5 lg:w-5 lg:h-5 transition-colors ${
              isFocused ? 'text-blue-500' : 'text-gray-400'
            }`}
          />
        </button>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          className="
            flex-1 py-3 lg:py-4 pr-2
            bg-transparent
            text-base lg:text-base font-medium
            text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none
            appearance-none
            min-h-[56px]
          "
        />

        {/* Clear Button */}
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={clearSearch}
              className="p-2 mr-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="
            mr-3 px-6 py-3 rounded-xl
            bg-gradient-to-r from-blue-600 to-blue-700
            text-white font-semibold
            hover:from-blue-500 hover:to-blue-600
            active:scale-95
            transition-all duration-200
            shadow-md hover:shadow-lg
            min-h-[48px]
          "
        >
          Search
        </button>
      </div>

      {/* Real Search Results Dropdown */}
      <AnimatePresence>
        {isFocused && (searchResults.length > 0 || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="
              absolute z-50 w-full mt-2
              bg-white dark:bg-gray-800
              rounded-xl shadow-xl
              border border-gray-200 dark:border-gray-700
              overflow-hidden
              max-h-96 overflow-y-auto
            "
          >
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                <span className="ml-2 text-gray-500">Searching...</span>
              </div>
            ) : (
              <>
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={() => handleSelectResult(result)}
                    className="
                      w-full px-5 py-3 text-left
                      hover:bg-gray-50 dark:hover:bg-gray-700
                      transition-colors
                      flex items-start gap-3
                      min-h-[48px]
                      border-b border-gray-100 dark:border-gray-700 last:border-b-0
                    "
                  >
                    <div className="mt-1">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                        {result.title}
                      </div>
                      {result.subtitle && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {result.subtitle}
                        </div>
                      )}
                      {result.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
                          {result.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))}

                {searchResults.length > 0 && (
                  <button
                    onClick={handleSearch}
                    className="
                      w-full px-5 py-3 text-center
                      bg-gray-50 dark:bg-gray-700/50
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      transition-colors
                      text-sm text-blue-600 dark:text-blue-400
                      font-medium
                    "
                  >
                    View all results for "{query}" →
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UnifiedSearch