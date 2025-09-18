import { safeAuth } from './safe-auth'
import { ensureCurrentAppUser, fetchCurrentAppUser, type AppUserRecord } from './user-mapping'
import { logger } from '@/lib/utils/logger'

export interface AdminStatus {
  user: AppUserRecord | null
  isAdmin: boolean
}

/**
 * Resolve the admin status for the current authenticated user.
 * Ensures the Supabase mapping exists on first visit.
 */
export async function resolveAdminStatus(): Promise<AdminStatus> {
  const userRecord = await ensureCurrentAppUser()
  const isAdmin = Boolean(userRecord?.is_admin)

  return {
    user: userRecord,
    isAdmin,
  }
}

/**
 * Check if the current user is an administrator.
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const status = await resolveAdminStatus()
    return status.isAdmin
  } catch (error) {
    logger.error('Failed to determine admin status', { error })
    return false
  }
}

/**
 * Ensure the current user is an administrator. Throws if not authenticated or unauthorized.
 */
export async function requireAdmin(): Promise<void> {
  const { userId } = await safeAuth()

  if (!userId) {
    throw new Error('Authentication required')
  }

  const hasAccess = await isAdmin()
  if (!hasAccess) {
    throw new Error('Admin access required')
  }
}

/**
 * Fetch the admin mapping without triggering an upsert.
 */
export async function getCachedAdminRecord(): Promise<AppUserRecord | null> {
  return fetchCurrentAppUser()
}
