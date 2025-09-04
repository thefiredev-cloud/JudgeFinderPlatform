'use client'

import { useState, useEffect } from 'react'
import dynamicImport from 'next/dynamic'
import Link from 'next/link'
import { isAdminEmail } from '@/lib/auth/admin-client'
import { CheckCircleIcon, BuildingIcon, UserIcon, ShieldIcon } from 'lucide-react'

// Check if Clerk is available
const hasValidClerkKeys = () => {
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
  
  // Skip auth if explicitly disabled or if keys are not configured
  if (process.env.SKIP_AUTH_BUILD === 'true') {
    return false
  }
  
  // Check if keys are actual values (not placeholders)
  return pubKey.startsWith('pk_') && !pubKey.includes('YOUR') && !pubKey.includes('CONFIGURE')
}

// Dynamically import SignUp component only when Clerk is available
const SignUp = hasValidClerkKeys() 
  ? dynamicImport(() => import('@clerk/nextjs').then(mod => mod.SignUp), { 
      ssr: false,
      loading: () => <div className="text-center py-8"><span className="text-gray-400">Loading...</span></div>
    })
  : () => (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-white mb-4">Create Account</h2>
        <p className="text-gray-400 mb-6">Authentication is currently disabled</p>
        <Link 
          href="/dashboard" 
          className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all shadow-lg"
        >
          Continue to Dashboard
        </Link>
      </div>
    )

interface CustomSignUpProps {
  fallbackRedirectUrl?: string
  forceRedirectUrl?: string
  afterSignInUrl?: string  // Keep for backward compatibility
  afterSignUpUrl?: string  // Keep for backward compatibility
}

export function CustomSignUp({ 
  fallbackRedirectUrl = '/dashboard', 
  forceRedirectUrl = '/welcome',
  afterSignInUrl,  // Deprecated
  afterSignUpUrl   // Deprecated
}: CustomSignUpProps) {
  // Use new props if available, fall back to old ones for compatibility
  const redirectUrl = forceRedirectUrl || afterSignUpUrl || '/welcome'
  const signInRedirect = fallbackRedirectUrl || afterSignInUrl || '/dashboard'
  const [email, setEmail] = useState('')
  const [userType, setUserType] = useState<'admin' | 'user' | null>(null)
  const [showSignUp, setShowSignUp] = useState(false)

  // Check email from URL params if coming from email verification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get('email_address')
    if (emailParam) {
      checkUserType(emailParam)
    }
  }, [])

  const checkUserType = (emailAddress: string) => {
    const isAdmin = isAdminEmail(emailAddress)
    setEmail(emailAddress)
    setUserType(isAdmin ? 'admin' : 'user')
  }

  // Listen for Clerk form changes to detect email input
  useEffect(() => {
    const checkEmailInput = () => {
      const emailInput = document.querySelector('input[name="emailAddress"]') as HTMLInputElement
      if (emailInput && emailInput.value && emailInput.value !== email) {
        checkUserType(emailInput.value)
      }
    }

    const interval = setInterval(checkEmailInput, 500)
    return () => clearInterval(interval)
  }, [email])

  return (
    <div className="w-full">
      {!showSignUp && userType === 'user' && (
        <div className="mb-6 p-6 bg-blue-950/30 border border-blue-800/50 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-enterprise-primary/20 rounded-full flex items-center justify-center">
                <BuildingIcon className="w-5 h-5 text-enterprise-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                Legal Professional Registration
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                This registration is exclusively for law firms, attorneys, and legal professionals. 
                You'll gain access to advanced features and professional tools beyond our public analytics.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  <span>Export detailed judicial reports</span>
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  <span>Team collaboration features</span>
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  <span>API access for integrations</span>
                </div>
                <div className="flex items-center text-gray-300 text-sm">
                  <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                  <span>Priority support</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
                <p className="text-xs text-yellow-300">
                  <strong>Requirements:</strong> Valid bar number or law firm verification required
                </p>
              </div>
              <button
                onClick={() => setShowSignUp(true)}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-enterprise-primary to-enterprise-deep text-white rounded-lg hover:shadow-lg hover:shadow-enterprise-deep/25 transition-all font-medium"
              >
                Continue Professional Registration
              </button>
            </div>
          </div>
        </div>
      )}

      {!showSignUp && userType === 'admin' && (
        <div className="mb-6 p-6 bg-purple-950/30 border border-purple-800/50 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-600/20 rounded-full flex items-center justify-center">
                <ShieldIcon className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                Administrator Access Detected
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Welcome back, administrator. You'll have full access to the platform including 
                administrative tools and system management features.
              </p>
              <button
                onClick={() => setShowSignUp(true)}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-pink-600/25 transition-all font-medium"
              >
                Continue to Admin Sign Up
              </button>
            </div>
          </div>
        </div>
      )}

      {(showSignUp || !userType) && (
        <SignUp 
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-transparent shadow-none border-none',
              headerTitle: 'text-white text-xl font-semibold',
              headerSubtitle: 'text-gray-300',
              socialButtonsBlockButton: 'bg-gray-700/50 border border-gray-600 hover:bg-gray-600/50 text-white',
              socialButtonsBlockButtonText: 'text-white font-medium',
              dividerLine: 'bg-gray-600',
              dividerText: 'text-gray-400',
              formFieldLabel: 'text-gray-300 font-medium',
              formFieldInput: 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-enterprise-primary focus:ring-enterprise-primary/20',
              formButtonPrimary: userType === 'admin' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg'
                : 'bg-gradient-to-r from-enterprise-primary to-enterprise-deep hover:from-enterprise-accent hover:to-enterprise-primary text-white font-medium shadow-lg',
              footerActionText: 'text-gray-400',
              footerActionLink: 'text-enterprise-primary hover:text-enterprise-accent',
              identityPreviewText: 'text-gray-300',
              identityPreviewEditButton: 'text-enterprise-primary hover:text-enterprise-accent',
            }
          }}
          fallbackRedirectUrl={userType === 'admin' ? '/admin' : signInRedirect}
          forceRedirectUrl={userType === 'admin' ? '/admin' : redirectUrl}
        />
      )}
    </div>
  )
}