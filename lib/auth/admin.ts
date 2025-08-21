import { auth, currentUser } from '@clerk/nextjs/server'

// Admin email addresses from environment
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || []

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await currentUser()
    if (!user?.emailAddresses?.length) {
      return false
    }

    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase()
    return userEmail ? ADMIN_EMAILS.includes(userEmail) : false
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Check if a specific email is an admin
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Require admin access - throws error if not admin
 */
export async function requireAdmin(): Promise<void> {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const isUserAdmin = await isAdmin()
  if (!isUserAdmin) {
    throw new Error('Admin access required')
  }
}

/**
 * Get user role based on email
 */
export async function getUserRole(): Promise<'admin' | 'user'> {
  const isUserAdmin = await isAdmin()
  return isUserAdmin ? 'admin' : 'user'
}