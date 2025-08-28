'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ReactNode } from 'react'
import { ThemeProvider } from './ThemeProvider'

export function Providers({ children }: { children: ReactNode }) {
  // Get the publishable key - Netlify will provide this at runtime
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  
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
  
  // Only use ClerkProvider if we have a valid key
  // This prevents the "useUser can only be used within ClerkProvider" error
  if (clerkPublishableKey && 
      clerkPublishableKey.startsWith('pk_') && 
      !clerkPublishableKey.includes('YOUR') && 
      !clerkPublishableKey.includes('CONFIGURE')) {
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
  
  // Fallback without Clerk if no valid key is available
  // This allows the app to run without authentication
  if (process.env.NODE_ENV === 'production') {
    console.warn('Clerk authentication not configured - running without auth')
  }
  
  return content
}