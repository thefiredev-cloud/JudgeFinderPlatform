'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ReactNode } from 'react'
import { ThemeProvider } from './ThemeProvider'

// Check environment variables outside of component render
const SKIP_AUTH = process.env.SKIP_AUTH_BUILD === 'true'
const CLERK_PUB_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''

// Determine if we should use Clerk at build time
const shouldUseClerk = !SKIP_AUTH && 
  CLERK_PUB_KEY.startsWith('pk_') && 
  !CLERK_PUB_KEY.includes('YOUR') && 
  !CLERK_PUB_KEY.includes('CONFIGURE')

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
    return (
      <ClerkProvider>
        {content}
      </ClerkProvider>
    )
  }
  
  return content
}