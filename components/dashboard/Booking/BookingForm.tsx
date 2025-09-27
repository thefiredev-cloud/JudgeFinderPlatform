import { useMemo } from 'react'
import type { AdSpotWithDetails } from '@/types/advertising'
import { usePricingQuote } from './pricing'

export interface BookingOptions {
  startDate: string
  durationMonths: number
  exclusive: boolean
  bundleSize: number
}

interface BookingFormProps {
  spot: AdSpotWithDetails
  bookingOptions: BookingOptions
  onChange: (options: BookingOptions) => void
}

function resolveTier(spot: AdSpotWithDetails): string | null {
  if (spot.pricing_tier) {
    return spot.pricing_tier
  }
  if (spot.entity_type === 'judge') {
    return 'verified_listing_tier_a'
  }
  return spot.pricing_tier ?? null
}

export function BookingForm({ spot, bookingOptions, onChange }: BookingFormProps) {
  const tier = useMemo(() => resolveTier(spot), [spot])

  const { quote, loading, error } = usePricingQuote({
    tier: tier ?? '',
    months: bookingOptions.durationMonths,
    exclusive: bookingOptions.exclusive,
    bundleSize: bookingOptions.bundleSize,
  })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
        <input
          type="date"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={bookingOptions.startDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(event) => onChange({ ...bookingOptions, startDate: event.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={bookingOptions.durationMonths}
          onChange={(event) => onChange({ ...bookingOptions, durationMonths: Number(event.target.value) })}
        >
          <option value={1}>Monthly</option>
          <option value={12}>Annual (10×)</option>
        </select>
      </div>

      <div className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div>
          <p className="text-sm font-medium text-gray-900">Exclusive Rotation</p>
          <p className="text-xs text-gray-600 mt-1">
            Reserve both rotations for your firm (1.75× monthly rate). Useful when sellout is high and intent is critical.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={bookingOptions.exclusive}
            onChange={(event) => onChange({ ...bookingOptions, exclusive: event.target.checked })}
          />
          Exclusive
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">County Bundle Size</label>
        <p className="text-xs text-gray-500 mb-2">Automatic –10% for 5+ judges, –15% for 10+. You can adjust later before checkout.</p>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={bookingOptions.bundleSize}
          onChange={(event) => onChange({ ...bookingOptions, bundleSize: Number(event.target.value) })}
        >
          <option value={1}>Single judge</option>
          <option value={5}>5-judge county bundle</option>
          <option value={10}>10+ judge county bundle</option>
        </select>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
        <p className="font-semibold text-blue-900">Pricing Summary</p>
        {loading && <p className="mt-1 text-blue-800">Calculating pricing…</p>}
        {error && <p className="mt-1 text-red-600">{error}</p>}
        {quote && (
          <ul className="mt-2 space-y-1 text-blue-900">
            <li>
              Monthly Rate: <span className="font-semibold">${quote.monthly_rate?.toLocaleString() ?? '—'}</span>
            </li>
            <li>
              Total Due at Checkout:{' '}
              <span className="font-semibold">${quote.total_price?.toLocaleString() ?? '—'}</span>
            </li>
            {quote.savings !== undefined && quote.savings !== null && (
              <li className="text-green-700">Savings vs month-to-month: ${quote.savings.toLocaleString()}</li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
