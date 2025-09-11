'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ReactNode } from 'react'
import { ThemeProvider } from './ThemeProvider'

// Skip authentication during build to prevent errors
const SKIP_AUTH_BUILD = process.env.SKIP_AUTH_BUILD === 'true'

export function Providers({ children }: { children: ReactNode }) {
  // Get the publishable key - Netlify will provide this at runtime
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
  
  // Check if we have a valid, non-placeholder key
  const hasValidKey = clerkPublishableKey && 
    clerkPublishableKey.startsWith('pk_') && 
    !clerkPublishableKey.includes('YOUR') && 
    !clerkPublishableKey.includes('CONFIGURE') &&
    !clerkPublishableKey.includes('dummy')
  
  // Check if we're in a browser environment
  const isClient = typeof window !== 'undefined'
  
  // During build or when auth is disabled, skip ClerkProvider
  const shouldUseClerk = !SKIP_AUTH_BUILD && hasValidKey
  
  // Log warning in production if no valid key (only on client)
  if (isClient && !hasValidKey && process.env.NODE_ENV === 'production') {
    console.warn('Clerk authentication not configured - running without auth')
  }
  
  const content = (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
  
  // Always render the same structure on server and client
  if (shouldUseClerk) {
    return (
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/auth/login'}
        signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/auth/register'}
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/welcome"
      >
        {content}
      </ClerkProvider>
    )
  }
  
  // Fallback without ClerkProvider
  return content
}