'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, MapPin, Users, TrendingUp, Calendar, ChevronRight, Star } from 'lucide-react'
import AdSpotBookingModal from './AdSpotBookingModal'
import type { AdSpotWithDetails } from '@/types/advertising'
import { BookingForm, BookingOptions } from './Booking/BookingForm'
import { usePricingQuote } from './Booking/pricing'

interface AdSpotsExplorerProps {
  advertiserId: string
  preselectedPlan?: string
  showPlanContext?: boolean
}

export default function AdSpotsExplorer({ advertiserId, preselectedPlan, showPlanContext = false }: AdSpotsExplorerProps) {
  const [spots, setSpots] = useState<AdSpotWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [entityType, setEntityType] = useState<'all' | 'judge' | 'court'>('all')
  const [courtLevel, setCourtLevel] = useState<'all' | 'federal' | 'state'>(() => {
    // Pre-set court level based on selected plan
    if (preselectedPlan?.includes('federal')) return 'federal'
    if (preselectedPlan?.includes('state')) return 'state'
    return 'all'
  })
  const [priceRange, setPriceRange] = useState<'all' | 'budget' | 'standard' | 'premium'>('all')
  const [jurisdiction, setJurisdiction] = useState<string>('all')
  const [selectedSpot, setSelectedSpot] = useState<AdSpotWithDetails | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingOptions, setBookingOptions] = useState<BookingOptions>({
    startDate: '',
    durationMonths: 1,
    exclusive: false,
    bundleSize: 1,
  })

  const pricingTier = selectedSpot?.pricing_tier
  const { quote: selectedQuote } = usePricingQuote({
    tier: pricingTier && pricingTier.length > 0 ? pricingTier : '',
    months: bookingOptions.durationMonths,
    exclusive: bookingOptions.exclusive,
    bundleSize: bookingOptions.bundleSize,
    debounceMs: 0,
  })

  const fetchAdSpots = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        entity_type: entityType === 'all' ? '' : entityType,
        court_level: courtLevel === 'all' ? '' : courtLevel,
        price_range: priceRange,
        jurisdiction: jurisdiction === 'all' ? '' : jurisdiction,
        status: 'available'
      })

      const response = await fetch(`/api/advertising/spots/available?${params}`)
      const data = await response.json()
      
      setSpots(data.spots || [])
    } catch (error) {
      console.error('Error fetching ad spots:', error)
      setSpots([])
    } finally {
      setLoading(false)
    }
  }, [entityType, courtLevel, priceRange, jurisdiction])

  useEffect(() => {
    fetchAdSpots()
  }, [fetchAdSpots])

  const filteredSpots = spots.filter(spot => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return spot.entity_name.toLowerCase().includes(query) ||
             spot.entity_details.jurisdiction?.toLowerCase().includes(query) ||
             spot.entity_details.court_name?.toLowerCase().includes(query)
    }
    return true
  })

  const getPriceRangeLabel = (spot: AdSpotWithDetails) => {
    // Dynamic pricing based on court level for judges
    if (spot.entity_type === 'judge') {
      if (spot.court_level === 'federal') {
        return { label: 'Federal', color: 'text-blue-600 bg-blue-50', price: 500 }
      } else {
        return { label: 'State', color: 'text-green-600 bg-green-50', price: 200 }
      }
    }
    // Default pricing for courts
    const price = spot.base_price_monthly
    if (price <= 300) return { label: 'Budget', color: 'text-green-600 bg-green-50', price }
    if (price <= 500) return { label: 'Standard', color: 'text-blue-600 bg-blue-50', price }
    return { label: 'Premium', color: 'text-purple-600 bg-purple-50', price }
  }

  // Get plan details for display
  const getPlanDetails = () => {
    if (!preselectedPlan) return null
    
    const isFederal = preselectedPlan.includes('federal')
    const isAnnual = preselectedPlan.includes('annual')
    
    return {
      type: isFederal ? 'Federal Judge' : 'State Judge',
      price: isFederal ? 500 : 200,
      billing: isAnnual ? 'Annual' : 'Monthly',
      savings: isAnnual ? (isFederal ? 1000 : 400) : 0
    }
  }

  const planDetails = getPlanDetails()

  return (
    <>
      <div className="space-y-6">
        {/* Plan Context Banner */}
        {showPlanContext && planDetails && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">
                  Selected Plan: {planDetails.type} Advertising
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  ${planDetails.price}/month • {planDetails.billing} billing
                  {planDetails.savings > 0 && (
                    <span className="ml-2 text-green-600">
                      (Save ${planDetails.savings}/year)
                    </span>
                  )}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Showing {courtLevel === 'federal' ? 'Federal' : courtLevel === 'state' ? 'State' : 'All'} judge profiles available for advertising
                </p>
              </div>
              <button
                onClick={() => window.history.back()}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Change Plan
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by judge name, court, or jurisdiction..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-4">
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="judge">Judge Profiles</option>
                <option value="court">Court Profiles</option>
              </select>

              {entityType === 'judge' && (
                <select
                  value={courtLevel}
                  onChange={(e) => setCourtLevel(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Court Levels</option>
                  <option value="federal">Federal Judges ($500/mo)</option>
                  <option value="state">State Judges ($200/mo)</option>
                </select>
              )}

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Prices</option>
                <option value="budget">Budget (≤$200)</option>
                <option value="standard">Standard ($201-$500)</option>
                <option value="premium">Premium ($500+)</option>
              </select>

              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Jurisdictions</option>
                <option value="Orange County">Orange County</option>
                <option value="Los Angeles County">Los Angeles County</option>
                <option value="San Diego County">San Diego County</option>
                <option value="Riverside County">Riverside County</option>
                <option value="San Bernardino County">San Bernardino County</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Available Ad Spots ({filteredSpots.length})
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter className="h-4 w-4" />
                <span>Filtered results</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading available spots...</p>
            </div>
          ) : filteredSpots.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No available ad spots found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSpots.map((spot) => {
                const priceInfo = getPriceRangeLabel(spot)
                
                return (
                  <div
                    key={spot.id}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedSpot(spot)
                      setShowBookingModal(true)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {spot.entity_name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${priceInfo.color}`}>
                            {priceInfo.label}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                            Position {spot.position}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          {spot.entity_details.jurisdiction && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{spot.entity_details.jurisdiction}</span>
                            </div>
                          )}
                          {spot.entity_details.court_name && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{spot.entity_details.court_name}</span>
                            </div>
                          )}
                          {spot.entity_details.case_volume && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              <span>{spot.entity_details.case_volume.toLocaleString()} cases</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              ${priceInfo.price.toLocaleString()}<span className="text-sm font-normal text-gray-500">/month</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <Star className="h-4 w-4 text-gray-300" />
                            <span className="text-sm text-gray-600 ml-1">High visibility</span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400 mt-2" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showBookingModal && selectedSpot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Book {selectedSpot.entity_name}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Judge sponsorships renew automatically monthly with ACH-first invoicing. Annual billing available at 10× monthly.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBookingModal(false)
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close booking modal"
              >
                ×
              </button>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-[2fr_1fr]">
              <div>
                <BookingForm
                  spot={selectedSpot}
                  bookingOptions={bookingOptions}
                  onChange={setBookingOptions}
                />
              </div>

              <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Summary</h3>
                  <p className="mt-1 text-xs text-gray-600">
                    We will generate an ACH-first invoice for {bookingOptions.bundleSize} judge(s). Cards remain available for solo placements.
                  </p>
                </div>

                <dl className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <dt>Billing Term</dt>
                    <dd>{bookingOptions.durationMonths >= 12 ? 'Annual (10×)' : 'Monthly'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Exclusive</dt>
                    <dd>{bookingOptions.exclusive ? 'Yes (Exclusive rotation)' : 'Standard rotation'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Bundle Size</dt>
                    <dd>{bookingOptions.bundleSize} judge(s)</dd>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900">
                    <dt>Total due at checkout</dt>
                    <dd>
                      {selectedQuote?.total_price != null ? `$${selectedQuote.total_price.toLocaleString()}` : '—'}
                    </dd>
                  </div>
                </dl>

                <button
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  disabled={!bookingOptions.startDate || !selectedQuote?.total_price}
                >
                  Continue to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}