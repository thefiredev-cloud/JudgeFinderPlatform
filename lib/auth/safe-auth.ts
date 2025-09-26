/**
 * Safe auth wrapper that prevents build failures when Clerk is not configured
 */

import { logger } from '@/lib/utils/logger'

const hasConfiguredSecret = () => {
  const secretKey = process.env.CLERK_SECRET_KEY || ''
  return secretKey.startsWith('sk_')
}

const hasValidClerkKeys = () => {
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''

  if (process.env.NODE_ENV === 'production' && !hasConfiguredSecret()) {
    throw new Error('Clerk secret key missing or invalid in production')
  }
  
  if (process.env.SKIP_AUTH_BUILD === 'true') {
    logger.warn('Auth build skip enabled; Clerk auth disabled for this request context', {
      scope: 'auth',
      reason: 'SKIP_AUTH_BUILD'
    })
    return false
  }
  
  const isValidPubKey = pubKey.startsWith('pk_') && !pubKey.includes('YOUR') && !pubKey.includes('CONFIGURE')
  const secretConfigured = hasConfiguredSecret()

  if (!isValidPubKey || !secretConfigured) {
    logger.warn('Clerk keys missing or invalid; returning anonymous auth context', {
      scope: 'auth',
      publishableConfigured: isValidPubKey,
      secretConfigured
    })
  }
  
  return isValidPubKey && secretConfigured
}

export async function safeAuth() {
  if (!hasValidClerkKeys()) {
    return { userId: null }
  }
  
  try {
    const { auth } = await import('@clerk/nextjs/server')
    return await auth()
  } catch (error) {
    console.error('Auth error:', error)
    return { userId: null }
  }
}

export async function safeCurrentUser() {
  if (!hasValidClerkKeys()) {
    return null
  }
  
  try {
    const { currentUser } = await import('@clerk/nextjs/server')
    return await currentUser()
  } catch (error) {
    console.error('Current user error:', error)
    return null
  }
}