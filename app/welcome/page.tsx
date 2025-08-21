import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export default async function WelcomePage() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId) {
    redirect('/sign-in')
  }

  // Check if user has already completed onboarding
  // This would be stored in user metadata or preferences
  if (user?.publicMetadata?.onboardingCompleted) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to JudgeFinder, {user?.firstName || 'there'}!
            </h1>
            <p className="text-xl text-gray-400">
              Let's get you set up to make the most of our judicial research platform
            </p>
          </div>
          
          <OnboardingWizard user={user} />
        </div>
      </div>
    </div>
  )
}