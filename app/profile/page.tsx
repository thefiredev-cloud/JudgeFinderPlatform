import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ProfileSettings } from '@/components/profile/ProfileSettings'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-gray-400">
            Manage your account preferences and subscription settings
          </p>
        </div>
        
        <ProfileSettings user={user} />
      </div>
    </div>
  )
}