import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOrCreateAdvertiserProfile } from '@/lib/auth/roles'
import { createServerClient } from '@/lib/supabase/server'
import AdvertiserOverview from '@/components/dashboard/AdvertiserOverview'
import type { AdvertiserDashboardStats } from '@/types/advertising'

export const dynamic = 'force-dynamic'

async function getAdvertiserStats(advertiserId: string): Promise<AdvertiserDashboardStats> {
  const supabase = await createServerClient()

  // Get campaign statistics
  const { data: campaigns } = await supabase
    .from('ad_campaigns')
    .select('id, status, budget_spent, impressions_total, clicks_total')
    .eq('advertiser_id', advertiserId)

  const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0
  const totalSpend = campaigns?.reduce((sum, c) => sum + (c.budget_spent || 0), 0) || 0
  const totalImpressions = campaigns?.reduce((sum, c) => sum + (c.impressions_total || 0), 0) || 0
  const totalClicks = campaigns?.reduce((sum, c) => sum + (c.clicks_total || 0), 0) || 0
  const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  // Get booking statistics
  const { data: bookings } = await supabase
    .from('ad_bookings')
    .select('id, booking_status, start_date')
    .eq('advertiser_id', advertiserId)

  const activeBookings = bookings?.filter(b => b.booking_status === 'active').length || 0
  const upcomingBookings = bookings?.filter(b => 
    b.booking_status === 'confirmed' && 
    new Date(b.start_date) > new Date()
  ).length || 0

  return {
    total_campaigns: campaigns?.length || 0,
    active_campaigns: activeCampaigns,
    total_spend: totalSpend,
    total_impressions: totalImpressions,
    total_clicks: totalClicks,
    average_ctr: Number(averageCtr.toFixed(2)),
    active_bookings: activeBookings,
    upcoming_bookings: upcomingBookings
  }
}

export default async function AdvertiserDashboardPage() {
  const user = await currentUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Get or check advertiser profile
  const advertiserProfile = await getOrCreateAdvertiserProfile()
  
  if (!advertiserProfile) {
    // Redirect to onboarding if no profile exists
    redirect('/dashboard/advertiser/onboarding')
  }

  // Get dashboard statistics
  const stats = await getAdvertiserStats(advertiserProfile.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {advertiserProfile.firm_name}
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your advertising campaigns and track performance
        </p>
      </div>

      {/* Verification Banner */}
      {advertiserProfile.verification_status !== 'verified' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Account Verification Pending
              </h3>
              <p className="mt-2 text-sm text-yellow-700">
                Your account is currently being verified. You can create campaigns, but they won't go live until verification is complete.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Component */}
      <AdvertiserOverview 
        stats={stats} 
        advertiserProfile={advertiserProfile}
      />
    </div>
  )
}