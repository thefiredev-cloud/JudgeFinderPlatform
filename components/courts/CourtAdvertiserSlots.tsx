'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import type { MouseEvent } from 'react'
import { ExternalLink, Briefcase, Phone, Shield } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useInView } from 'react-intersection-observer'

interface CourtAdvertiserSlotsProps {
  courtId: string
  courtName: string
}

interface AdvertiserInfo {
  firm_name: string
  description: string
  website?: string
  phone?: string
  email?: string
  logo_url?: string
  specializations?: string[]
  badge?: string
}

interface CreativeInfo {
  headline: string
  description: string
  cta_text: string
  cta_url: string
}

export interface AdSlot {
  id: string
  position: number
  status?: string
  base_price_monthly?: number
  pricing_tier?: string | null
  advertiser?: AdvertiserInfo
  creative?: CreativeInfo
}

interface ApiResponse {
  slots?: AdSlot[]
}

class AdSlotDataManager {
  async getNormalizedSlots(courtId: string): Promise<AdSlot[]> {
    try {
      const response = await fetch(`/api/courts/${courtId}/advertising-slots`)

      if (!response.ok) {
        return this.createPlaceholderSlots()
      }

      const data: ApiResponse = await response.json()
      return this.normalizeSlots(data.slots ?? [])
    } catch (error) {
      console.error('Error fetching ad slots:', error)
      return this.createPlaceholderSlots()
    }
  }

  createPlaceholderSlots(): AdSlot[] {
    return [1, 2, 3].map((position) => ({
      id: `placeholder-${position}`,
      position
    }))
  }

  private normalizeSlots(slots: AdSlot[]): AdSlot[] {
    const normalized: Record<number, AdSlot> = {}

    slots.forEach((slot) => {
      if (this.isValidSlot(slot)) {
        normalized[slot.position] = slot
      }
    })

    return [1, 2, 3].map((position) => normalized[position] ?? { id: `placeholder-${position}`, position })
  }

  private isValidSlot(slot: AdSlot): boolean {
    return typeof slot.position === 'number' && slot.position >= 1 && slot.position <= 3
  }
}

class AdvertiserAnalyticsTracker {
  private trackedImpressions = new Set<string>()

  constructor(private readonly courtId: string) {}

  trackImpression(slotId: string) {
    if (this.trackedImpressions.has(slotId)) {
      return
    }

    this.trackedImpressions.add(slotId)

    fetch('/api/advertising/track-impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slotId, court_id: this.courtId })
    }).catch(() => {
      // Silently ignore tracking errors to avoid blocking UI.
    })
  }

  trackClick(slotId: string, url: string) {
    fetch('/api/advertising/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slotId, court_id: this.courtId })
    }).catch(() => {
      // Tracking failures should not impact user navigation.
    })

    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

const placeholderManager = new AdSlotDataManager()

export function CourtAdvertiserSlots({ courtId, courtName }: CourtAdvertiserSlotsProps) {
  const [slots, setSlots] = useState<AdSlot[]>(placeholderManager.createPlaceholderSlots())
  const [loading, setLoading] = useState(true)

  const dataManager = useMemo(() => new AdSlotDataManager(), [])
  const analyticsTracker = useMemo(() => new AdvertiserAnalyticsTracker(courtId), [courtId])

  useEffect(() => {
    let isMounted = true

    const loadSlots = async () => {
      setLoading(true)
      const normalizedSlots = await dataManager.getNormalizedSlots(courtId)

      if (isMounted) {
        setSlots(normalizedSlots)
        setLoading(false)
      }
    }

    loadSlots()

    return () => {
      isMounted = false
    }
  }, [courtId, dataManager])

  if (loading) {
    return <SlotsSkeleton />
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-2" aria-label={`Verified legal professionals serving ${courtName}`}>
        Legal Professionals Serving {courtName}
      </h3>

      {slots.map((slot) => (
        <AdvertiserSlotCard key={slot.id} slot={slot} courtId={courtId} tracker={analyticsTracker} />
      ))}

      <InfoFooter />
    </div>
  )
}

interface AdvertiserSlotCardProps {
  slot: AdSlot
  courtId: string
  tracker: AdvertiserAnalyticsTracker
}

function AdvertiserSlotCard({ slot, tracker, courtId }: AdvertiserSlotCardProps) {
  const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: true })
  const websiteUrl = slot.advertiser?.website
  const ctaUrl = slot.creative?.cta_url

  useEffect(() => {
    if (inView && slot.advertiser) {
      tracker.trackImpression(slot.id)
    }
  }, [inView, tracker, slot.id, slot.advertiser])

  const handleWebsiteClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (!websiteUrl) {
        return
      }

      event.preventDefault()
      tracker.trackClick(slot.id, websiteUrl)
    },
    [slot.id, tracker, websiteUrl]
  )

  const handleCtaClick = useCallback(() => {
    if (!ctaUrl) {
      return
    }

    tracker.trackClick(slot.id, ctaUrl)
  }, [slot.id, tracker, ctaUrl])

  return (
    <div ref={ref} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {slot.advertiser ? (
        <AdvertiserDetails slot={slot} onWebsiteClick={handleWebsiteClick} onCtaClick={handleCtaClick} />
      ) : (
        <EmptySlotCard courtId={courtId} position={slot.position} />
      )}
    </div>
  )
}

interface AdvertiserDetailsProps {
  slot: AdSlot
  onWebsiteClick: (event: MouseEvent<HTMLAnchorElement>) => void
  onCtaClick: () => void
}

function AdvertiserDetails({ slot, onWebsiteClick, onCtaClick }: AdvertiserDetailsProps) {
  const advertiser = slot.advertiser!

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">{advertiser.firm_name}</h4>
            {advertiser.badge && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">{advertiser.badge}</span>
            )}
          </div>
          <p className="text-sm text-gray-600">{advertiser.description}</p>
        </div>
        {advertiser.logo_url && (
          <Image src={advertiser.logo_url} alt={`${advertiser.firm_name} logo`} width={48} height={48} className="object-contain" />
        )}
      </div>

      {slot.creative && (
        <div className="p-3 bg-gray-50 rounded-lg space-y-1">
          <h5 className="font-medium text-gray-900 text-sm">{slot.creative.headline}</h5>
          <p className="text-sm text-gray-600">{slot.creative.description}</p>
        </div>
      )}

      {advertiser.specializations && advertiser.specializations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {advertiser.specializations.map((specialization) => (
            <span key={specialization} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
              {specialization}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-2 text-sm">
        {advertiser.phone && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="h-3 w-3" />
            <span>{advertiser.phone}</span>
          </div>
        )}
        {advertiser.website && (
          <div className="flex items-center gap-2 text-gray-600">
            <ExternalLink className="h-3 w-3" />
            <a
              href={advertiser.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
              onClick={onWebsiteClick}
            >
              Visit Website
            </a>
          </div>
        )}
      </div>

      {slot.creative?.cta_text && slot.creative.cta_url && (
        <button
          type="button"
          onClick={onCtaClick}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {slot.creative.cta_text}
        </button>
      )}
    </div>
  )
}

interface EmptySlotCardProps {
  courtId: string
  position: number
}

function EmptySlotCard({ courtId, position }: EmptySlotCardProps) {
  const bookingParams = new URLSearchParams({
    preselected: 'true',
    entityType: 'court',
    entityId: courtId,
    position: String(position)
  })

  return (
    <div className="p-4 text-center bg-gray-50 space-y-2">
      <Briefcase className="h-8 w-8 text-gray-400 mx-auto" />
      <p className="text-sm font-medium text-gray-700">Advertising Space Available</p>
      <p className="text-xs text-gray-500">Position #{position} • Premium visibility</p>
      <Link
        href={`/dashboard/advertiser/ad-spots?${bookingParams.toString()}`}
        className="inline-block px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      >
        Book This Spot
      </Link>
    </div>
  )
}

function InfoFooter() {
  return (
    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      <div className="flex items-start gap-2">
        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
        <div className="text-xs text-gray-700 space-y-1">
          <p className="font-medium">Verified Legal Professionals</p>
          <p>All advertisers are verified attorneys with active bar memberships.</p>
        </div>
      </div>
    </div>
  )
}

function SlotsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((skeletonKey) => (
        <div key={`skeleton-${skeletonKey}`} className="bg-gray-50 rounded-lg p-4 animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}


