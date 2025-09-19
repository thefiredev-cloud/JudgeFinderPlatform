'use client'

import { useEffect, useState, useCallback } from 'react'
import { ExternalLink, Briefcase, Phone, Mail, Award, Shield, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface CourtAdvertiserSlotsProps {
  courtId: string
  courtName: string
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

export function CourtAdvertiserSlots({ courtId, courtName }: CourtAdvertiserSlotsProps) {
  const [slots, setSlots] = useState<AdSlot[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAdSlots = useCallback(async () => {
    try {
      setLoading(true)
      // Fetch active ad slots for this court
      const response = await fetch(`/api/courts/${courtId}/advertising-slots`)
      
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
  }, [courtId])

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
      body: JSON.stringify({ slot_id: slotId, court_id: courtId })
    }).catch(console.error)
    
    // Open URL in new tab
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Legal Professionals
      </h3>
      
      {slots.map((slot) => (
        <div key={slot.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          {slot.advertiser ? (
            <div className="p-4">
              {/* Advertiser Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">
                      {slot.advertiser.firm_name}
                    </h4>
                    {slot.advertiser.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        {slot.advertiser.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {slot.advertiser.description}
                  </p>
                </div>
                {slot.advertiser.logo_url && (
                  <Image
                    src={slot.advertiser.logo_url}
                    alt={slot.advertiser.firm_name}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                )}
              </div>

              {/* Creative Content */}
              {slot.creative && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 text-sm mb-1">
                    {slot.creative.headline}
                  </h5>
                  <p className="text-sm text-gray-600">
                    {slot.creative.description}
                  </p>
                </div>
              )}

              {/* Specializations */}
              {slot.advertiser.specializations && slot.advertiser.specializations.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {slot.advertiser.specializations.map((spec, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {spec}
                    </span>
                  ))}
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-1 text-sm mb-3">
                {slot.advertiser.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-3 w-3" />
                    <span>{slot.advertiser.phone}</span>
                  </div>
                )}
                {slot.advertiser.website && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <ExternalLink className="h-3 w-3" />
                    <a
                      href={slot.advertiser.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                      onClick={(e) => {
                        e.preventDefault()
                        trackClick(slot.id, slot.advertiser!.website!)
                      }}
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              {slot.creative?.cta_text && slot.creative?.cta_url && (
                <button
                  onClick={() => trackClick(slot.id, slot.creative!.cta_url)}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {slot.creative.cta_text}
                </button>
              )}
            </div>
          ) : (
            // Empty Slot - Available for Booking
            <div className="p-4 text-center bg-gray-50">
              <Briefcase className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Advertising Space Available
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Position #{slot.position} • Premium visibility
              </p>
              <Link
                href="/professional"
                className="inline-block px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Book This Spot
              </Link>
            </div>
          )}
        </div>
      ))}

      {/* Info Footer */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-gray-700">
            <p className="font-medium mb-1">Verified Legal Professionals</p>
            <p>All advertisers are verified attorneys with active bar memberships.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
