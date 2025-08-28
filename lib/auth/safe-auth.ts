/**
 * Safe auth wrapper that prevents build failures when Clerk is not configured
 */

const hasValidClerkKeys = () => {
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
  const secretKey = process.env.CLERK_SECRET_KEY || ''
  
  // Skip auth if explicitly disabled or if keys are not configured
  if (process.env.SKIP_AUTH_BUILD === 'true') {
    return false
  }
  
  // Check if keys are actual values (not placeholders)
  const isValidPubKey = pubKey.startsWith('pk_') && !pubKey.includes('YOUR') && !pubKey.includes('CONFIGURE')
  const isValidSecretKey = secretKey.startsWith('sk_') && !secretKey.includes('YOUR') && !secretKey.includes('CONFIGURE')
  
  return isValidPubKey && isValidSecretKey
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