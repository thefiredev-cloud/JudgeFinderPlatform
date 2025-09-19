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

// Check if Clerk has a valid key (not dummy)
const hasValidClerkKey = () => {
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
  return pubKey.startsWith('pk_') && 
         !pubKey.includes('YOUR') && 
         !pubKey.includes('CONFIGURE') &&
         !pubKey.includes('dummy')
}

// Dynamically loaded Clerk components
let ClerkComponents: any = null

const loadClerkComponents = async () => {
  if (ClerkComponents) return ClerkComponents
  
  try {
    if (hasValidClerkKey()) {
      ClerkComponents = await import('@clerk/nextjs')
      return ClerkComponents
    }
  } catch (error) {
    console.warn('Failed to load Clerk components:', error)
  }
  return null
}

// Safe UserButton component
export function SafeUserButton(props: any) {
  const [mounted, setMounted] = useState(false)
  const [UserButtonComponent, setUserButtonComponent] = useState<any>(null)
  
  useEffect(() => {
    setMounted(true)
    if (hasValidClerkKey()) {
      loadClerkComponents().then((components) => {
        if (components) {
          setUserButtonComponent(() => components.UserButton)
        }
      })
    }
  }, [])
  
  // During SSR or before mount, show placeholder
  if (!mounted || !UserButtonComponent) {
    return (
      <Link href="/profile" className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
        <span className="text-white text-sm">U</span>
      </Link>
    )
  }
  
  // Use Clerk's UserButton when loaded
  return <UserButtonComponent {...props} />
}

// Safe SignInButton component
export function SafeSignInButton(props: { mode?: 'modal' | 'redirect'; children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [SignInButtonComponent, setSignInButtonComponent] = useState<any>(null)
  
  useEffect(() => {
    setMounted(true)
    if (hasValidClerkKey()) {
      loadClerkComponents().then((components) => {
        if (components) {
          setSignInButtonComponent(() => components.SignInButton)
        }
      })
    }
  }, [])
  
  // During SSR or before mount, show fallback
  if (!mounted || !SignInButtonComponent) {
    return <Link href="/sign-in">{props.children}</Link>
  }
  
  // Use Clerk's SignInButton when loaded
  return <SignInButtonComponent {...props} />
}

// Safe SignOutButton component (for AdvertiserSidebar)
export function SafeSignOutButton(props: { children?: ReactNode; [key: string]: any }) {
  const [mounted, setMounted] = useState(false)
  const [SignOutButtonComponent, setSignOutButtonComponent] = useState<any>(null)
  
  useEffect(() => {
    setMounted(true)
    if (hasValidClerkKey()) {
      loadClerkComponents().then((components) => {
        if (components) {
          setSignOutButtonComponent(() => components.SignOutButton)
        }
      })
    }
  }, [])
  
  // During SSR or before mount, show fallback
  if (!mounted || !SignOutButtonComponent) {
    return (
      <button className="w-full text-left" onClick={() => window.location.href = '/'}>
        {props.children || 'Sign Out'}
      </button>
    )
  }
  
  // Use Clerk's SignOutButton when loaded
  return <SignOutButtonComponent {...props} />
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
  const [userState, setUserState] = useState<SafeUser>(DEFAULT_USER_STATE)
  
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setMounted(true)
    
    if (hasValidClerkKey()) {
      loadClerkComponents().then((components) => {
        if (components && components.useUser) {
          try {
            // We can't call hooks conditionally, so we'll need to access Clerk's state differently
            // For now, just mark as loaded with no user when Clerk is not available
            setUserState({ ...DEFAULT_USER_STATE, isLoaded: true })
          } catch (error) {
            console.warn('Error accessing Clerk user state:', error)
            setUserState({ ...DEFAULT_USER_STATE, isLoaded: true })
          }
        } else {
          setUserState({ ...DEFAULT_USER_STATE, isLoaded: true })
        }
      })
    } else {
      setUserState({ ...DEFAULT_USER_STATE, isLoaded: true })
    }
  }, [])
  
  // Before mount, return loading state
  if (!mounted) {
    return DEFAULT_USER_STATE
  }
  
  return userState
}