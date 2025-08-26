import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdvertiser } from '@/lib/auth/roles'
import AdvertiserSidebar from '@/components/dashboard/AdvertiserSidebar'

export default async function AdvertiserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const userIsAdvertiser = await isAdvertiser()
  if (!userIsAdvertiser) {
    redirect('/dashboard/advertiser/onboarding') // Redirect to onboarding if not an advertiser
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdvertiserSidebar />
        <main className="flex-1 ml-64">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Advertiser Dashboard - JudgeFinder.io',
  description: 'Manage your advertising campaigns on JudgeFinder',
}