'use client'

import { useState } from 'react'
import { X, Calendar, CreditCard, AlertCircle, Check } from 'lucide-react'
import type { AdSpotWithDetails } from '@/types/advertising'

interface AdSpotBookingModalProps {
  spot: AdSpotWithDetails
  advertiserId: string
  onClose: () => void
  onSuccess: () => void
}

export default function AdSpotBookingModal({ spot, advertiserId, onClose, onSuccess }: AdSpotBookingModalProps) {
  const [startDate, setStartDate] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Dynamic pricing based on court level
  const getMonthlyPrice = () => {
    if (spot.entity_type === 'judge') {
      return spot.court_level === 'federal' ? 500 : 200
    }
    return spot.base_price_monthly
  }

  const monthlyPrice = getMonthlyPrice()

  async function handleBooking() {
    try {
      setLoading(true)
      setError('')

      // For subscriptions, we don't set an end date upfront
      const start = new Date(startDate)

      const response = await fetch('/api/advertising/spots/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad_spot_id: spot.id,
          advertiser_id: advertiserId,
          campaign_id: campaignId || null,
          start_date: startDate,
          end_date: null, // Subscription will handle this
          price_paid: monthlyPrice
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to book ad spot')
      }

      const data = await response.json()

      if (data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url
      } else {
        // Booking successful without payment (for demo)
        onSuccess()
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Book Ad Spot
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
              {/* Spot Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{spot.entity_name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Position: {spot.position}</p>
                  <p>Type: {spot.entity_type === 'judge' ? 'Judge Profile' : 'Court Profile'}</p>
                  {spot.entity_type === 'judge' && spot.court_level && (
                    <p className="flex items-center gap-2">
                      Court Level: 
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        spot.court_level === 'federal' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {spot.court_level === 'federal' ? 'Federal' : 'State'}
                      </span>
                    </p>
                  )}
                  {spot.entity_details.jurisdiction && (
                    <p>Jurisdiction: {spot.entity_details.jurisdiction}</p>
                  )}
                  <p className="font-semibold text-lg text-gray-900 mt-2">
                    ${monthlyPrice.toLocaleString()}/month
                  </p>
                </div>
              </div>

              {/* Booking Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign (Optional)
                  </label>
                  <select
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No campaign selected</option>
                    <option value="campaign-1">Summer 2025 Campaign</option>
                    <option value="campaign-2">Q1 2025 Outreach</option>
                  </select>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Monthly Subscription</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Rate</span>
                    <span className="font-medium text-lg">${monthlyPrice.toLocaleString()}/month</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    • Cancel anytime from your dashboard<br/>
                    • Automatic monthly renewal<br/>
                    • Secure payment via Stripe
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBooking}
                  disabled={!startDate || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Continue to Stripe Checkout
                    </>
                  )}
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}