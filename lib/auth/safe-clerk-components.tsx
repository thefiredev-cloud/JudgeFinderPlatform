'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'

// Type definitions for Clerk user
interface SafeUser {
  isSignedIn: boolean
  user: any | null
  isLoaded: boolean
}

// Default mock data for SSR/build time
const DEFAULT_USER_STATE: SafeUser = {
  isSignedIn: false,
  user: null,
  isLoaded: false
}

// Check if we're in a browser environment
const isBrowser = () => typeof window !== 'undefined'

// Check if Clerk should be enabled
const shouldUseClerk = () => {
  // Always return false during SSR/SSG
  if (!isBrowser()) return false
  
  // Check environment variables
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
  const skipAuth = process.env.SKIP_AUTH_BUILD === 'true'
  
  if (skipAuth) return false
  
  // Check if keys are actual values (not placeholders)
  return pubKey.startsWith('pk_') && !pubKey.includes('YOUR') && !pubKey.includes('CONFIGURE')
}

// Lazy load Clerk components only on client side
let ClerkComponents: any = null

const loadClerkComponents = () => {
  if (!isBrowser() || ClerkComponents) return
  
  if (shouldUseClerk()) {
    try {
      ClerkComponents = require('@clerk/nextjs')
    } catch (error) {
      console.warn('Failed to load Clerk:', error)
    }
  }
}

// Safe UserButton component
export function SafeUserButton(props: any) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    loadClerkComponents()
  }, [])
  
  // During SSR or before mount, show placeholder
  if (!mounted || !ClerkComponents?.UserButton) {
    return (
      <Link href="/profile" className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
        <span className="text-white text-sm">U</span>
      </Link>
    )
  }
  
  const Component = ClerkComponents.UserButton
  return <Component {...props} />
}

// Safe SignInButton component
export function SafeSignInButton(props: { mode?: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    loadClerkComponents()
  }, [])
  
  // During SSR or before mount, show fallback
  if (!mounted || !ClerkComponents?.SignInButton) {
    return <Link href="/sign-in">{props.children}</Link>
  }
  
  const Component = ClerkComponents.SignInButton
  return <Component {...props} />
}

// Safe SignOutButton component (for AdvertiserSidebar)
export function SafeSignOutButton(props: { children?: ReactNode; [key: string]: any }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    loadClerkComponents()
  }, [])
  
  // During SSR or before mount, show fallback
  if (!mounted || !ClerkComponents?.SignOutButton) {
    return (
      <button className="w-full text-left" onClick={() => window.location.href = '/'}>
        {props.children || 'Sign Out'}
      </button>
    )
  }
  
  const Component = ClerkComponents.SignOutButton
  return <Component {...props} />
}

// Safe useUser hook - Returns mock data during SSR, real data on client
export function useSafeUser(): SafeUser {
  // During SSR, always return default state immediately
  if (!isBrowser()) {
    return DEFAULT_USER_STATE
  }
  
  // Client-side only logic
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [mounted, setMounted] = useState(false)
  
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setMounted(true)
    loadClerkComponents()
  }, [])
  
  // Before mount, return loading state
  if (!mounted) {
    return DEFAULT_USER_STATE
  }
  
  // After mount, try to use Clerk's hook if available
  if (ClerkComponents?.useUser) {
    try {
      // This will only be called on client after Clerk is loaded
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const clerkUser = ClerkComponents.useUser()
      return {
        isSignedIn: clerkUser.isSignedIn || false,
        user: clerkUser.user || null,
        isLoaded: clerkUser.isLoaded !== false
      }
    } catch (error) {
      console.warn('Error using Clerk useUser hook:', error)
      return { ...DEFAULT_USER_STATE, isLoaded: true }
    }
  }
  
  // No Clerk available, return default state as loaded
  return { ...DEFAULT_USER_STATE, isLoaded: true }
}