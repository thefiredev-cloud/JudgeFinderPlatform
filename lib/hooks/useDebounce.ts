import { useState, useEffect } from 'react'

/**
 * Custom hook for debouncing values
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

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

/**
 * Custom hook for debouncing search specifically
 * @param searchQuery - The search query string
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns Object with current value and debounced value
 */
export function useSearchDebounce(searchQuery: string, delay: number = 300) {
  const debouncedSearchQuery = useDebounce(searchQuery, delay)
  
  return {
    searchQuery,
    debouncedSearchQuery,
    isSearching: searchQuery !== debouncedSearchQuery
  }
}