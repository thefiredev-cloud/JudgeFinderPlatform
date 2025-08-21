import { SignIn } from '@clerk/nextjs'

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
                      <linearGradient id="signInGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <rect x="19" y="10" width="2" height="20" fill="url(#signInGradient)" />
                    <path d="M 20 10 L 17 7 L 23 7 Z" fill="url(#signInGradient)" />
                    <rect x="10" y="13" width="20" height="1" fill="url(#signInGradient)" />
                    <line x1="13" y1="13" x2="13" y2="18" stroke="url(#signInGradient)" strokeWidth="1" />
                    <path d="M 11 18 Q 13 20 15 18" fill="none" stroke="url(#signInGradient)" strokeWidth="1.5" />
                    <line x1="27" y1="13" x2="27" y2="18" stroke="url(#signInGradient)" strokeWidth="1" />
                    <path d="M 25 18 Q 27 20 29 18" fill="none" stroke="url(#signInGradient)" strokeWidth="1.5" />
                    <rect x="16" y="30" width="8" height="2" rx="1" fill="url(#signInGradient)" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
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
              Welcome Back to 
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                {" "}JudgeFinder
              </span>
            </h1>
            
            <p className="text-lg text-gray-300 mb-8">
              Access comprehensive analytics on judges' ruling patterns, decision trends, and case outcomes.
            </p>

            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-300">1,810+ California judges</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-gray-300">300,000+ case records</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">909 courts covered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Sign In Form */}
        <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700/50">
                  <svg width="32" height="32" viewBox="0 0 40 40" className="p-1">
                    <defs>
                      <linearGradient id="mobileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <rect x="19" y="10" width="2" height="20" fill="url(#mobileGradient)" />
                    <path d="M 20 10 L 17 7 L 23 7 Z" fill="url(#mobileGradient)" />
                  </svg>
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                  JudgeFinder
                </span>
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-8 shadow-xl">
              <SignIn 
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
                    formFieldInput: 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20',
                    formButtonPrimary: 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg',
                    footerActionText: 'text-gray-400',
                    footerActionLink: 'text-blue-400 hover:text-blue-300',
                    identityPreviewText: 'text-gray-300',
                    identityPreviewEditButton: 'text-blue-400 hover:text-blue-300',
                  }
                }}
                afterSignInUrl="/dashboard"
                afterSignUpUrl="/dashboard"
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                New to JudgeFinder?{' '}
                <a href="/sign-up" className="text-blue-400 hover:text-blue-300 font-medium">
                  Create your free account
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}