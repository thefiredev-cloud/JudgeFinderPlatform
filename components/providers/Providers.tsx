'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ReactNode } from 'react'
import { ThemeProvider } from './ThemeProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </ClerkProvider>
  )
}