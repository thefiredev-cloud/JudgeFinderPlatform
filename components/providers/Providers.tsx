'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ReactNode } from 'react'
import { ThemeProvider } from './ThemeProvider'

export function Providers({ children }: { children: ReactNode }) {
  // Check if Clerk keys are available and not placeholders
  // Move this inside the component to avoid SSR issues
  const hasValidClerkKeys = () => {
    // Skip auth during build or if explicitly disabled
    if (process.env.SKIP_AUTH_BUILD === 'true' || process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      return false
    }
    
    const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
    
    // Check if public key is an actual value (not placeholder)
    const isValidPubKey = pubKey.startsWith('pk_') && !pubKey.includes('YOUR') && !pubKey.includes('CONFIGURE')
    
    return isValidPubKey
  }
  
  const useClerk = hasValidClerkKeys()
  
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
  
  if (useClerk) {
    return (
      <ClerkProvider>
        {content}
      </ClerkProvider>
    )
  }
  
  return content
}