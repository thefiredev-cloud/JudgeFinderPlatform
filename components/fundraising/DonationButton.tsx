'use client'

import { useState } from 'react'
import { HeartHandshake, ArrowRight } from 'lucide-react'

interface DonationButtonProps {
  amount: number
  variant?: 'header' | 'footer' | 'inline'
  className?: string
}

export function DonationButton({ amount, variant = 'inline', className }: DonationButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDonate() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/donations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Unable to start donation checkout')
      }

      const data = await response.json()
      if (data.url) {
        window.location.assign(data.url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Donation failed')
    } finally {
      setLoading(false)
    }
  }

  const baseClasses =
    variant === 'header'
      ? 'inline-flex items-center gap-2 rounded-full border border-secondary-foreground/40 bg-secondary/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-secondary-foreground transition hover:bg-secondary/50'
      : variant === 'footer'
      ? 'inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20'
      : 'inline-flex items-center gap-2 rounded-full border border-primary/60 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20'

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleDonate}
        disabled={loading}
        className={`${baseClasses} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        <HeartHandshake className="h-4 w-4" aria-hidden />
        <span>Support transparency</span>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}
