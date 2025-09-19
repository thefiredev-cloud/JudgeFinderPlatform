import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isStripeEnabled } from '@/lib/ads/stripe'
import { getAdvertiserProfileForUser, listAvailableAdSpots } from '@/lib/ads/service'

export const dynamic = 'force-dynamic'

export default async function AdvertiserDashboardPage() {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }

  const advertiserProfile = await getAdvertiserProfileForUser(user.id)
  if (!advertiserProfile) {
    redirect('/dashboard/advertiser/onboarding')
  }

  const stripeReady = isStripeEnabled()
  const environment = process.env.NODE_ENV || 'development'
  const sampleSpots = await listAvailableAdSpots(3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Advertising Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Campaign management and billing tools are in private beta. We\'ll notify {advertiserProfile.contact_email} when your workspace is enabled.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-6 text-blue-800">
        <h2 className="text-lg font-semibold mb-2">Ad management is coming soon</h2>
        <p className="text-sm text-blue-700">
          We\'re finalizing Stripe billing, automated placements, and analytics before opening this dashboard.
        </p>
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="font-medium">Stripe connection</dt>
            <dd className={`px-2 py-1 rounded-full ${stripeReady ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {stripeReady ? 'Configured' : 'Not configured'}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="font-medium">Environment</dt>
            <dd className="text-blue-900 uppercase">{environment}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="font-medium">Account status</dt>
            <dd className="capitalize">{advertiserProfile.account_status}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="font-medium">Verification</dt>
            <dd className="capitalize">{advertiserProfile.verification_status}</dd>
          </div>
        </dl>
        {!stripeReady && (
          <p className="mt-4 text-xs text-blue-700">
            Add <code className="rounded bg-blue-100 px-1">STRIPE_SECRET_KEY</code> to your environment to enable billing workflows.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Preview available placements</h2>
        {sampleSpots.length === 0 ? (
          <p className="text-sm text-gray-600">
            No ad spots are marked as available yet. We\'re preparing inventory for the beta launch.
          </p>
        ) : (
          <ul className="space-y-3">
            {sampleSpots.map((spot) => (
              <li key={spot.id} className="rounded border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex justify-between text-sm text-gray-700">
                  <span className="font-medium capitalize">{spot.entity_type} placement</span>
                  <span className="text-gray-500">Position {spot.position}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm text-gray-600">
                  <span>Base price: ${spot.base_price_monthly.toLocaleString()} / mo</span>
                  <span>Impressions: {spot.impressions_total.toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
