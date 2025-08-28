'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ReactNode } from 'react'
import { ThemeProvider } from './ThemeProvider'

// Check if Clerk keys are available and not placeholders
const hasValidClerkKeys = () => {
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
  
  // Skip auth if explicitly disabled or if keys are not configured
  if (process.env.SKIP_AUTH_BUILD === 'true') {
    return false
  }
  
  // Check if public key is an actual value (not placeholder)
  const isValidPubKey = pubKey.startsWith('pk_') && !pubKey.includes('YOUR') && !pubKey.includes('CONFIGURE')
  
  return isValidPubKey
}

export function Providers({ children }: { children: ReactNode }) {
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