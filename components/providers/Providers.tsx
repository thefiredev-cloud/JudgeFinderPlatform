'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ReactNode } from 'react'
import { ThemeProvider } from './ThemeProvider'

// Check environment variables outside of component render
const CLERK_PUB_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''

// Determine if we should use Clerk
// In production, always try to use Clerk even if keys are not configured
// This allows Netlify environment variables to be used
const shouldUseClerk = process.env.NODE_ENV === 'production' || (
  CLERK_PUB_KEY.startsWith('pk_') && 
  !CLERK_PUB_KEY.includes('YOUR') && 
  !CLERK_PUB_KEY.includes('CONFIGURE')
)

export function Providers({ children }: { children: ReactNode }) {
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
  
  if (shouldUseClerk) {
    // In production, always wrap with ClerkProvider
    // The provider will handle missing keys gracefully
    return (
      <ClerkProvider
        publishableKey={CLERK_PUB_KEY || undefined}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/welcome"
      >
        {content}
      </ClerkProvider>
    )
  }
  
  return content
}