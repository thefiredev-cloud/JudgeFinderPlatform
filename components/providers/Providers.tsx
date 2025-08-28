'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ReactNode, useState, useEffect } from 'react'
import { ThemeProvider } from './ThemeProvider'

// Skip authentication during build to prevent errors
const SKIP_AUTH_BUILD = process.env.SKIP_AUTH_BUILD === 'true'

export function Providers({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Get the publishable key - Netlify will provide this at runtime
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
  
  // Check if we have a valid, non-placeholder key
  const hasValidKey = clerkPublishableKey && 
    clerkPublishableKey.startsWith('pk_') && 
    !clerkPublishableKey.includes('YOUR') && 
    !clerkPublishableKey.includes('CONFIGURE') &&
    !clerkPublishableKey.includes('dummy')
  
  // During build or when auth is disabled, skip ClerkProvider
  const shouldUseClerk = !SKIP_AUTH_BUILD && hasValidKey && isClient
  
  // Log warning in production if no valid key
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
  
  // Only render ClerkProvider on client with valid key
  if (shouldUseClerk) {
    return (
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/welcome"
      >
        {content}
      </ClerkProvider>
    )
  }
  
  // Fallback without ClerkProvider
  return content
}