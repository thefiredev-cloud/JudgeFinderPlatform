import { CustomSignUp } from '@/components/auth/CustomSignUp'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="flex min-h-screen">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8">
          <div className="mx-auto max-w-md text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-2.5">
                <div className="relative w-12 h-12 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700/50 shadow-lg overflow-hidden">
                  <svg width="48" height="48" viewBox="0 0 40 40" className="absolute inset-0 p-2">
                    <defs>
                      <linearGradient id="signUpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#1e40af" />
                      </linearGradient>
                    </defs>
                    <rect x="19" y="10" width="2" height="20" fill="url(#signUpGradient)" />
                    <path d="M 20 10 L 17 7 L 23 7 Z" fill="url(#signUpGradient)" />
                    <rect x="10" y="13" width="20" height="1" fill="url(#signUpGradient)" />
                    <line x1="13" y1="13" x2="13" y2="18" stroke="url(#signUpGradient)" strokeWidth="1" />
                    <path d="M 11 18 Q 13 20 15 18" fill="none" stroke="url(#signUpGradient)" strokeWidth="1.5" />
                    <line x1="27" y1="13" x2="27" y2="18" stroke="url(#signUpGradient)" strokeWidth="1" />
                    <path d="M 25 18 Q 27 20 29 18" fill="none" stroke="url(#signUpGradient)" strokeWidth="1.5" />
                    <rect x="16" y="30" width="8" height="2" rx="1" fill="url(#signUpGradient)" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                      JudgeFinder
                    </span>
                    <span className="text-2xl font-light text-slate-400">.io</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">
                    Legal Analytics
                  </p>
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">
              Legal Professionals
              <span className="bg-gradient-to-r from-blue-400 to-blue-700 bg-clip-text text-transparent">
                {" "}Registration
              </span>
            </h1>
            
            <p className="text-lg text-gray-300 mb-8">
              Exclusive access for law firms and legal professionals to unlock advanced judicial analytics and professional features.
            </p>

            <div className="space-y-4 text-left mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-300">Priority access to advanced analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-300">Export reports and case summaries</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">Professional collaboration tools</span>
              </div>
            </div>

            {/* Professional Benefits Section */}
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Professional Features:</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Export detailed judicial analytics reports</span>
                </div>
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Team collaboration and case notes</span>
                </div>
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>API access for firm integrations</span>
                </div>
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Priority support and dedicated account management</span>
                </div>
              </div>
            </div>
            
            {/* Note about public access */}
            <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> Basic judge analytics are available to the public without registration. 
                Professional registration unlocks advanced features for law firms.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Sign Up Form */}
        <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700/50">
                  <svg width="32" height="32" viewBox="0 0 40 40" className="p-1">
                    <defs>
                      <linearGradient id="mobileSignUpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#1e40af" />
                      </linearGradient>
                    </defs>
                    <rect x="19" y="10" width="2" height="20" fill="url(#mobileSignUpGradient)" />
                    <path d="M 20 10 L 17 7 L 23 7 Z" fill="url(#mobileSignUpGradient)" />
                  </svg>
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                  JudgeFinder
                </span>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-8 shadow-xl">
              <CustomSignUp 
                afterSignInUrl="/dashboard"
                afterSignUpUrl="/welcome"
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link href="/sign-in" className="text-blue-400 hover:text-blue-300 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                By signing up, you agree to our{' '}
                <a href="/terms" className="text-blue-400 hover:text-blue-300">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-400 hover:text-blue-300">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}