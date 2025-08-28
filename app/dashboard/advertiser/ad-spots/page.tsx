import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOrCreateAdvertiserProfile } from '@/lib/auth/roles'
import AdSpotsExplorer from '@/components/dashboard/AdSpotsExplorer'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: {
    plan?: string
    preselected?: string
  }
}

export default async function AdSpotsPage({ searchParams }: PageProps) {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }

  const advertiserProfile = await getOrCreateAdvertiserProfile()
  
  if (!advertiserProfile) {
    redirect('/dashboard/advertiser/onboarding')
  }

  const { plan, preselected } = searchParams
  const showPlanContext = preselected === 'true'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Browse Ad Spots
        </h1>
        <p className="mt-2 text-gray-600">
          Find and book premium advertising positions on judge and court profiles
        </p>
      </div>

      {/* Ad Spots Explorer */}
      <AdSpotsExplorer 
        advertiserId={advertiserProfile.id}
        preselectedPlan={plan}
        showPlanContext={showPlanContext}
      />
    </div>
  )
}

export const metadata = {
  title: 'Browse Ad Spots - Advertiser Dashboard',
  description: 'Find and book advertising positions on JudgeFinder',
}