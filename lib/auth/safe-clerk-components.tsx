'use client'

import { ReactNode } from 'react'
import Link from 'next/link'

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

// Conditionally import Clerk components
let ClerkComponents: any = {
  UserButton: () => (
    <Link href="/profile" className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
      <span className="text-white text-sm">U</span>
    </Link>
  ),
  SignInButton: ({ children }: { children: ReactNode }) => (
    <Link href="/sign-in">{children}</Link>
  ),
  useUser: () => ({ isSignedIn: false, user: null, isLoaded: true })
}

if (hasValidClerkKeys()) {
  try {
    ClerkComponents = require('@clerk/nextjs')
  } catch (error) {
    console.warn('Failed to load Clerk:', error)
  }
}

// Safe UserButton component
export function SafeUserButton(props: any) {
  const Component = ClerkComponents.UserButton
  return <Component {...props} />
}

// Safe SignInButton component
export function SafeSignInButton(props: { mode?: string; children: ReactNode }) {
  const Component = ClerkComponents.SignInButton
  return <Component {...props} />
}

// Safe useUser hook
export function useSafeUser() {
  return ClerkComponents.useUser()
}