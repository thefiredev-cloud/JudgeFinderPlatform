'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Mic, MicOff, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface UnifiedSearchProps {
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

const UnifiedSearch: React.FC<UnifiedSearchProps> = ({ 
  placeholder = "Search judges, courts, or ask a question...", 
  className = "",
  autoFocus = false 
}) => {
  const [query, setQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const recognitionRef = useRef<any>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('')
        setQuery(transcript)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }
    }
  }, [])

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice search is not supported in your browser')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleSearch = () => {
    if (!query.trim()) return

    // Intelligent routing based on query type
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('judge') || lowerQuery.includes('bias') || lowerQuery.includes('analysis')) {
      router.push(`/judges?search=${encodeURIComponent(query)}`)
    } else if (lowerQuery.includes('court')) {
      router.push(`/courts?search=${encodeURIComponent(query)}`)
    } else {
      // Default to general search
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
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

  // Smart suggestions based on input
  useEffect(() => {
    if (query.length > 2) {
      const mockSuggestions = [
        `Search for Judge ${query}`,
        `${query} bias analysis`,
        `Courts in ${query}`,
        `Recent cases for ${query}`
      ].filter(s => s.toLowerCase().includes(query.toLowerCase()))
      setSuggestions(mockSuggestions.slice(0, 3))
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
          rounded-2xl shadow-lg
          border-2 transition-all duration-200
          ${isFocused 
            ? 'border-blue-500 shadow-xl scale-[1.02]' 
            : 'border-gray-200 dark:border-gray-700'
          }
        `}
      >
        {/* Search Icon */}
        <div className="pl-5 pr-3">
          <Search 
            className={`w-5 h-5 transition-colors ${
              isFocused ? 'text-blue-500' : 'text-gray-400'
            }`}
          />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="
            flex-1 py-4 pr-2
            bg-transparent
            text-base font-medium
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none
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

        {/* Voice Search Button */}
        <button
          onClick={handleVoiceInput}
          className={`
            mr-2 p-3 rounded-xl
            transition-all duration-200
            min-w-[48px] min-h-[48px]
            flex items-center justify-center
            ${isListening 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
          aria-label="Voice search"
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

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

      {/* Smart Suggestions Dropdown */}
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
                  setQuery(suggestion.replace(/^(Search for |Recent cases for )/, '').replace(' bias analysis', ''))
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

      {/* Voice Listening Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="
              absolute -top-16 left-1/2 transform -translate-x-1/2
              bg-red-500 text-white px-4 py-2 rounded-lg
              shadow-lg flex items-center gap-2
            "
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Listening...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UnifiedSearch