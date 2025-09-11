'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, Mic, MicOff, Sparkles, Brain, ChevronRight, Loader2, History, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAISearch } from '@/hooks/useAISearch'

interface AIUnifiedSearchProps {
  placeholder?: string
  className?: string
  autoFocus?: boolean
  showVoiceSearch?: boolean
  showHistory?: boolean
}

const AIUnifiedSearch: React.FC<AIUnifiedSearchProps> = ({ 
  placeholder = "Ask me anything about judges...", 
  className = "",
  autoFocus = false,
  showVoiceSearch = true,
  showHistory = true
}) => {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  
  const {
    query,
    results,
    suggestions,
    loading,
    intent,
    conversationalResponse,
    searchMemory,
    setQuery,
    performSearch,
    trackSelection,
    clearMemory,
    recentQueries
  } = useAISearch()

  // Voice search setup
  useEffect(() => {
    if (!showVoiceSearch || typeof window === 'undefined') return
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      setVoiceTranscript('')
    }

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('')
      
      setVoiceTranscript(transcript)
      setQuery(transcript)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (voiceTranscript) {
        performSearch(voiceTranscript)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    if (isListening) {
      recognition.start()
    } else {
      recognition.stop()
    }

    return () => {
      recognition.stop()
    }
  }, [isListening, showVoiceSearch])

  const handleSearch = () => {
    if (!query.trim()) return
    performSearch(query)
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setQuery('')
      setShowHistoryDropdown(false)
    }
  }

  const clearSearch = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const toggleVoiceSearch = () => {
    setIsListening(!isListening)
  }

  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion)
    performSearch(suggestion)
    router.push(`/search?q=${encodeURIComponent(suggestion)}`)
  }

  const selectHistoryItem = (historyQuery: string) => {
    setQuery(historyQuery)
    setShowHistoryDropdown(false)
    performSearch(historyQuery)
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Main Search Bar with Glassmorphism */}
      <motion.div 
        className={`
          relative flex items-center w-full
          bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl
          rounded-2xl shadow-2xl
          border-2 transition-all duration-300
          min-h-[60px] lg:min-h-[64px]
          ${isFocused 
            ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] scale-[1.02]' 
            : 'border-gray-200/50 dark:border-gray-700/50 hover:border-blue-400/50'
          }
        `}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* AI Icon with Pulse Animation */}
        <motion.div
          className="pl-4 pr-3 py-3 lg:pl-5 lg:pr-3"
          animate={loading ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : (
            <div className="relative">
              <Brain className={`w-5 h-5 transition-colors ${
                isFocused ? 'text-blue-500' : 'text-gray-400'
              }`} />
              {isFocused && (
                <motion.div
                  className="absolute inset-0 w-5 h-5 bg-blue-500 rounded-full opacity-30"
                  animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </div>
          )}
        </motion.div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => {
            setIsFocused(true)
            if (showHistory && recentQueries.length > 0) {
              setShowHistoryDropdown(true)
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsFocused(false)
              setShowHistoryDropdown(false)
            }, 200)
          }}
          placeholder={isListening ? "Listening..." : placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          className="
            flex-1 py-3 lg:py-4 pr-2
            bg-transparent
            text-base lg:text-lg font-medium
            text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none
            min-h-[48px]
          "
        />

        {/* Voice Transcript Display */}
        <AnimatePresence>
          {isListening && voiceTranscript && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute bottom-full mb-2 left-4 right-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {voiceTranscript}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mr-3">
          {/* Clear Button */}
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={clearSearch}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Voice Search Button */}
          {showVoiceSearch && (
            <motion.button
              onClick={toggleVoiceSearch}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg transition-all ${
                isListening 
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'
              }`}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </motion.button>
          )}

          {/* Search Button with Gradient */}
          <motion.button
            onClick={handleSearch}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="
              px-6 py-3 rounded-xl
              bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600
              text-white font-semibold
              hover:from-blue-700 hover:via-blue-800 hover:to-purple-700
              transition-all duration-300
              shadow-lg hover:shadow-xl
              min-h-[48px]
              flex items-center gap-2
            "
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI Search</span>
            <span className="sm:hidden">Search</span>
          </motion.button>
        </div>
      </motion.div>

      {/* AI Intent Display */}
      <AnimatePresence>
        {intent && intent.confidence > 0.7 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                AI understands: Looking for <strong>{intent.type}</strong> 
                {intent.searchType !== 'general' && ` by ${intent.searchType}`}
                <span className="ml-2 text-xs opacity-70">
                  ({Math.round(intent.confidence * 100)}% confident)
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversational Response */}
      <AnimatePresence>
        {conversationalResponse && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl"
          >
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {conversationalResponse}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions & History Dropdown */}
      <AnimatePresence>
        {isFocused && (suggestions.length > 0 || (showHistoryDropdown && recentQueries.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="
              absolute z-50 w-full mt-2
              bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl
              rounded-xl shadow-2xl
              border border-gray-200/50 dark:border-gray-700/50
              overflow-hidden
              max-h-96 overflow-y-auto
            "
          >
            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      AI Suggestions
                    </span>
                  </div>
                </div>
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => selectSuggestion(suggestion)}
                    className="
                      w-full px-5 py-3 text-left
                      hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50
                      dark:hover:from-blue-900/20 dark:hover:to-purple-900/20
                      transition-all duration-200
                      flex items-center gap-3
                      group
                    "
                  >
                    <TrendingUp className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {suggestion}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                ))}
              </div>
            )}

            {/* Search History */}
            {showHistoryDropdown && recentQueries.length > 0 && (
              <div>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Recent Searches
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      clearMemory()
                      setShowHistoryDropdown(false)
                    }}
                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                {recentQueries.map((historyQuery, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => selectHistoryItem(historyQuery)}
                    className="
                      w-full px-5 py-3 text-left
                      hover:bg-gray-50 dark:hover:bg-gray-800/50
                      transition-colors
                      flex items-center gap-3
                      group
                    "
                  >
                    <History className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">
                      {historyQuery}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AIUnifiedSearch