'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface UnifiedSearchProps {
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

const UnifiedSearch: React.FC<UnifiedSearchProps> = ({ 
  placeholder = "Enter your judge's name...", 
  className = "",
  autoFocus = false 
}) => {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleSearch = () => {
    if (!query.trim()) return

    // Route to judge search
    const searchQuery = query.trim()
    router.push(`/judges?search=${encodeURIComponent(searchQuery)}`)
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

  // Simple suggestions for common judge names
  useEffect(() => {
    if (query.length > 2) {
      const exampleJudges = [
        'Judge Smith',
        'Judge Martinez',
        'Judge Johnson',
        'Judge Williams',
        'Judge Brown'
      ]
      const filtered = exampleJudges
        .filter(name => name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }, [query])

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

      {/* Simple Suggestions Dropdown */}
      <AnimatePresence>
        {isFocused && suggestions.length > 0 && (
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
            "
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(suggestion)
                  handleSearch()
                }}
                className="
                  w-full px-5 py-3 text-left
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  transition-colors
                  flex items-center gap-3
                  min-h-[48px]
                "
              >
                <Search className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {suggestion}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UnifiedSearch