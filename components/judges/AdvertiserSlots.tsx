'use client'

import { useEffect, useState, useCallback } from 'react'
import { ExternalLink, Briefcase, Phone, Mail, Shield } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface AdvertiserSlotsProps {
  judgeId: string
  judgeName: string
}

interface AdSlot {
  id: string
  position: number
  status?: string
  base_price_monthly?: number
  pricing_tier?: string | null
  advertiser?: {
    firm_name: string
    description: string
    website?: string
    phone?: string
    email?: string
    logo_url?: string
    specializations?: string[]
    badge?: string
    bar_number?: string
  }
  creative?: {
    headline: string
    description: string
    cta_text: string
    cta_url: string
  }
}

interface ApiResponse {
  slots?: AdSlot[]
}

export function AdvertiserSlots({ judgeId, judgeName }: AdvertiserSlotsProps) {
  const [slots, setSlots] = useState<AdSlot[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAdSlots = useCallback(async () => {
    try {
      setLoading(true)
      // Fetch active ad slots for this judge
      const response = await fetch(`/api/judges/${judgeId}/advertising-slots`)
      
      if (!response.ok) {
        // Use demo data if API fails
        setSlots(getDemoSlots())
        return
      }

      const data: ApiResponse = await response.json()
      setSlots(data.slots ?? getDemoSlots())
    } catch (error) {
      console.error('Error fetching ad slots:', error)
      setSlots(getDemoSlots())
    } finally {
      setLoading(false)
    }
  }, [judgeId])

  useEffect(() => {
    fetchAdSlots()
  }, [fetchAdSlots])

  function getDemoSlots(): AdSlot[] {
    return [
      {
        id: '1',
        position: 1
        // Empty slot - available for booking
      },
      {
        id: '2',
        position: 2
        // Empty slot - available for booking
      },
      {
        id: '3',
        position: 3
        // Empty slot - available for booking
      }
    ]
  }

  function trackClick(slotId: string, url: string) {
    // Track ad click
    fetch('/api/advertising/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slotId, judge_id: judgeId })
    }).catch(console.error)
    
    // Open URL in new tab
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse rounded-2xl border border-border/60 bg-[hsl(var(--bg-2))] p-4">
            <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4" id="attorney-slots">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold text-[color:hsl(var(--text-1))]">
          Verified Legal Professionals
        </h3>
        <Link
          href="/docs/ads-policy"
          className="inline-flex items-center gap-2 text-xs font-medium text-[color:hsl(var(--accent))] transition-colors hover:text-[color:hsl(var(--text-1))]"
        >
          Understand our ad policy
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <p className="text-xs text-[color:hsl(var(--text-3))]">
        Listings labeled <span className="font-semibold text-[color:hsl(var(--accent))]">Ad</span> are paid placements. We verify
        every sponsor&apos;s California bar status before activation.
      </p>
      
      {slots.map((slot) => {
        const advertiser = slot.advertiser
        const barNumber = advertiser?.bar_number?.trim()
        const barVerificationUrl = barNumber
          ? `https://apps.calbar.ca.gov/attorney/Licensee/Detail/${barNumber}`
          : undefined

        return (
          <div
            key={slot.id}
            className="overflow-hidden rounded-2xl border border-border/60 bg-[hsl(var(--bg-2))] transition-shadow hover:shadow-lg"
          >
            {advertiser ? (
              <div className="space-y-4 p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center rounded-full border border-[rgba(110,168,254,0.45)] bg-[rgba(110,168,254,0.14)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:hsl(var(--accent))]"
                          aria-label="Sponsored listing"
                        >
                          Ad
                        </span>
                        {advertiser.badge && (
                          <span className="inline-flex items-center rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:hsl(var(--text-3))]">
                            {advertiser.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="mt-2 text-lg font-semibold text-[color:hsl(var(--text-1))]">
                        {advertiser.firm_name}
                      </h4>
                      <p className="mt-1 text-sm text-[color:hsl(var(--text-2))]">
                        {advertiser.description}
                      </p>
                    </div>
                    {advertiser.logo_url && (
                      <Image
                        src={advertiser.logo_url}
                        alt={advertiser.firm_name}
                        width={52}
                        height={52}
                        className="h-12 w-12 rounded-lg border border-border/40 bg-[hsl(var(--bg-1))] object-contain p-2"
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[color:hsl(var(--text-3))]">
                    {barVerificationUrl && (
                      <a
                        href={barVerificationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[color:hsl(var(--accent))] underline-offset-4 hover:text-[color:hsl(var(--text-1))]"
                      >
                        <Shield className="h-3 w-3" aria-hidden />
                        CA Bar #{barNumber}
                      </a>
                    )}
                    <span>Verified by JudgeFinder</span>
                  </div>
                </div>

                {slot.creative && (
                  <div className="rounded-xl border border-border/60 bg-[hsl(var(--bg-1))] p-4">
                    <h5 className="mb-1 text-sm font-semibold text-[color:hsl(var(--text-1))]">
                      {slot.creative.headline}
                    </h5>
                    <p className="text-sm text-[color:hsl(var(--text-2))]">{slot.creative.description}</p>
                  </div>
                )}

                {advertiser.specializations && advertiser.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {advertiser.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="inline-flex items-center rounded-full border border-border/50 bg-[hsl(var(--bg-1))] px-3 py-1 text-xs text-[color:hsl(var(--text-3))]"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-2 text-sm text-[color:hsl(var(--text-2))]">
                  {advertiser.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" aria-hidden />
                      <span>{advertiser.phone}</span>
                    </div>
                  )}
                  {advertiser.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" aria-hidden />
                      <a
                        href={`mailto:${advertiser.email}`}
                        className="text-[color:hsl(var(--accent))] transition-colors hover:text-[color:hsl(var(--text-1))]"
                      >
                        {advertiser.email}
                      </a>
                    </div>
                  )}
                  {advertiser.website && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" aria-hidden />
                      <a
                        href={advertiser.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[color:hsl(var(--accent))] transition-colors hover:text-[color:hsl(var(--text-1))]"
                        onClick={(event) => {
                          event.preventDefault()
                          trackClick(slot.id, advertiser.website!)
                        }}
                      >
                        Visit website
                      </a>
                    </div>
                  )}
                </div>

                {slot.creative?.cta_text && slot.creative?.cta_url && (
                  <button
                    type="button"
                    onClick={() => trackClick(slot.id, slot.creative!.cta_url)}
                    className="w-full rounded-full border border-[rgba(110,168,254,0.45)] bg-[rgba(110,168,254,0.15)] px-4 py-2 text-sm font-semibold text-[color:hsl(var(--accent))] transition-colors hover:bg-[rgba(110,168,254,0.25)]"
                  >
                    {slot.creative.cta_text}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 border border-dashed border-border/50 bg-[hsl(var(--bg-1))] p-6 text-center">
                <Briefcase className="h-8 w-8 text-[color:hsl(var(--text-3))]" aria-hidden />
                <p className="text-sm font-semibold text-[color:hsl(var(--text-1))]">
                  Advertising space available
                </p>
                <p className="text-xs text-[color:hsl(var(--text-3))]">
                  Position #{slot.position} • Premium visibility
                </p>
                <Link
                  href="/professional"
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-[hsl(var(--bg-2))] px-4 py-2 text-sm font-semibold text-[color:hsl(var(--text-2))] transition-colors hover:border-[rgba(110,168,254,0.45)] hover:text-[color:hsl(var(--text-1))]"
                >
                  Book this spot
                </Link>
              </div>
            )}
          </div>
        )
      })}

      <div className="mt-4 rounded-2xl border border-border/60 bg-[hsl(var(--bg-2))] p-4">
        <div className="flex items-start gap-2 text-xs text-[color:hsl(var(--text-3))]">
          <Shield className="mt-0.5 h-4 w-4 text-[color:hsl(var(--accent))]" aria-hidden />
          <div>
            <p className="mb-1 font-semibold text-[color:hsl(var(--text-2))]">Trust &amp; verification</p>
            <p>
              We confirm California bar standing and active insurance before approving any sponsor. Listings are removed
              immediately if a bar license lapses.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
