'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDebounce as useDebounceHook } from './useDebounce'

interface AISearchIntent {
  type: 'judge' | 'court' | 'jurisdiction' | 'mixed'
  searchType: 'name' | 'characteristic' | 'location' | 'case_type' | 'general'
  confidence: number
}

interface AISearchResult {
  id: string
  type: 'judge' | 'court' | 'jurisdiction'
  title: string
  subtitle?: string
  description?: string
  url: string
  relevanceScore?: number
  aiInsight?: string
}

interface AISearchResponse {
  success: boolean
  originalQuery: string
  enhancedQuery: string
  intent: AISearchIntent
  results: AISearchResult[]
  totalCount: number
  suggestions: string[]
  expandedTerms: string[]
  conversationalResponse?: string
  noResultsHelp?: string
  processingTime: number
}

interface SearchMemory {
  queries: string[]
  selectedResults: any[]
  preferences: {
    jurisdiction?: string
    caseType?: string
  }
}

export function useAISearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AISearchResult[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [intent, setIntent] = useState<AISearchIntent | null>(null)
  const [conversationalResponse, setConversationalResponse] = useState<string | null>(null)
  const [searchMemory, setSearchMemory] = useState<SearchMemory>({
    queries: [],
    selectedResults: [],
    preferences: {}
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const debouncedQuery = useDebounceHook(query, 300)

  // Load search memory from localStorage
  useEffect(() => {
    const savedMemory = localStorage.getItem('searchMemory')
    if (savedMemory) {
      try {
        setSearchMemory(JSON.parse(savedMemory))
      } catch (e) {
        console.error('Failed to load search memory:', e)
      }
    }
  }, [])

  // Save search memory to localStorage
  const saveMemory = useCallback((memory: SearchMemory) => {
    setSearchMemory(memory)
    localStorage.setItem('searchMemory', JSON.stringify(memory))
  }, [])

  // Perform AI-enhanced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setSuggestions([])
      setIntent(null)
      setConversationalResponse(null)
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/search/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          context: {
            previousQueries: searchMemory.queries.slice(-5),
            userLocation: searchMemory.preferences.jurisdiction,
            searchHistory: searchMemory.selectedResults.slice(-10)
          },
          includeSuggestions: true,
          limit: 20
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        // Fallback to regular search if AI fails
        const fallbackResponse = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=20`)
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          setResults(fallbackData.results || [])
          setSuggestions([])
          setIntent(null)
          setConversationalResponse(null)
        } else {
          throw new Error('Search failed')
        }
        return
      }

      const data: AISearchResponse = await response.json()

      setResults(data.results || [])
      setSuggestions(data.suggestions || [])
      setIntent(data.intent)
      setConversationalResponse(data.conversationalResponse || null)

      // Update search memory
      const updatedMemory = {
        ...searchMemory,
        queries: [...searchMemory.queries.slice(-49), searchQuery]
      }
      saveMemory(updatedMemory)

      // Track successful search in analytics (if available)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'ai_search', {
          query: searchQuery,
          intent_type: data.intent?.type,
          results_count: data.totalCount,
          processing_time: data.processingTime
        })
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('AI search error:', err)
        setError('Search failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [searchMemory, saveMemory])

  // Get suggestions for partial query
  const getSuggestions = useCallback(async (partialQuery: string) => {
    if (partialQuery.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(`/api/search/ai?q=${encodeURIComponent(partialQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (err) {
      console.error('Failed to get suggestions:', err)
    }
  }, [])

  // Debounced suggestion fetching
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      getSuggestions(debouncedQuery)
    } else {
      setSuggestions([])
    }
  }, [debouncedQuery, getSuggestions])

  // Track selected result
  const trackSelection = useCallback((result: AISearchResult) => {
    const updatedMemory = {
      ...searchMemory,
      selectedResults: [...searchMemory.selectedResults.slice(-99), result]
    }
    saveMemory(updatedMemory)
  }, [searchMemory, saveMemory])

  // Update preferences
  const updatePreferences = useCallback((preferences: Partial<SearchMemory['preferences']>) => {
    const updatedMemory = {
      ...searchMemory,
      preferences: { ...searchMemory.preferences, ...preferences }
    }
    saveMemory(updatedMemory)
  }, [searchMemory, saveMemory])

  // Clear search memory
  const clearMemory = useCallback(() => {
    const emptyMemory: SearchMemory = {
      queries: [],
      selectedResults: [],
      preferences: {}
    }
    saveMemory(emptyMemory)
  }, [saveMemory])

  return {
    // State
    query,
    results,
    suggestions,
    loading,
    error,
    intent,
    conversationalResponse,
    searchMemory,

    // Actions
    setQuery,
    performSearch,
    trackSelection,
    updatePreferences,
    clearMemory,

    // Utilities
    hasResults: results.length > 0,
    isSearching: loading,
    recentQueries: searchMemory.queries.slice(-5),
    topSuggestion: suggestions[0] || null
  }
}

// Custom debounce hook
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