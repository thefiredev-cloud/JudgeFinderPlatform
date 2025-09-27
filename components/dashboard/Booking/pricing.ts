import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PricingQuote } from '@/types/advertising'

interface PricingOptions {
  tier: string
  months: number
  exclusive?: boolean
  bundleSize?: number
}

interface UsePricingQuoteParams extends PricingOptions {
  debounceMs?: number
}

interface PricingState {
  loading: boolean
  error: string | null
  quote: PricingQuote | null
}

async function fetchPricing(options: PricingOptions): Promise<PricingQuote> {
  const response = await fetch('/api/ads/price', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'Unable to calculate pricing')
  }

  const data = await response.json()
  return data.pricing as PricingQuote
}

export function usePricingQuote({ tier, months, exclusive = false, bundleSize = 1, debounceMs = 250 }: UsePricingQuoteParams): PricingState {
  const [state, setState] = useState<PricingState>({ loading: false, error: null, quote: null })

  const payload = useMemo<PricingOptions>(() => ({ tier, months, exclusive, bundleSize }), [tier, months, exclusive, bundleSize])

  const loadPricing = useCallback(async () => {
    if (!tier || months <= 0) {
      setState({ loading: false, error: null, quote: null })
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const quote = await fetchPricing(payload)
      setState({ loading: false, error: null, quote })
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : 'Failed to load pricing', quote: null })
    }
  }, [payload, tier, months])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadPricing()
    }, debounceMs)

    return () => {
      clearTimeout(timer)
    }
  }, [loadPricing, debounceMs])

  return state
}
