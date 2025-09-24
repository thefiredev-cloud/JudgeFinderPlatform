import { auth, currentUser } from '@clerk/nextjs/server'
import { ensureCurrentAppUser } from '@/lib/auth/user-mapping'
import { redirect } from 'next/navigation'
import { UserDashboard } from '@/components/dashboard/UserDashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId) {
    redirect('/sign-in')
  }

  // Ensure Clerk↔Supabase mapping exists on first visit
  await ensureCurrentAppUser()

  // Serialize the user data to pass to client component
  const serializedUser = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.emailAddresses[0]?.emailAddress || '',
    createdAt: user.createdAt
  } : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {serializedUser?.firstName || 'User'}
          </h1>
          <p className="text-gray-400">
            Access your saved judges, recent searches, and personalized analytics
          </p>
        </div>
        
        <UserDashboard user={serializedUser} />
      </div>
    </div>
  )
}