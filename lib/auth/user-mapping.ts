import type { User } from '@clerk/nextjs/server'
import { safeCurrentUser } from './safe-auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export interface AppUserRecord {
  clerk_user_id: string
  email: string
  full_name: string | null
  is_admin: boolean
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

function extractEmail(user: User): string | null {
  const primaryEmailId = user.primaryEmailAddressId
  const emails = user.emailAddresses || []
  const primaryEmail = primaryEmailId
    ? emails.find(address => address.id === primaryEmailId)?.emailAddress
    : emails[0]?.emailAddress

  return primaryEmail ? primaryEmail.toLowerCase() : null
}

function extractFullName(user: User): string | null {
  if (user.fullName) {
    return user.fullName
  }

  const parts = [user.firstName, user.lastName].filter(Boolean)
  return parts.length ? parts.join(' ') : user.username || null
}

async function upsertAppUser(user: User, email: string): Promise<AppUserRecord | null> {
  const supabase = await createServiceRoleClient()
  const payload = {
    clerk_user_id: user.id,
    email,
    full_name: extractFullName(user),
    last_seen_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('app_users')
    .upsert(payload, { onConflict: 'clerk_user_id' })
    .select()
    .single<AppUserRecord>()

  if (error) {
    logger.error('Failed to upsert app user', { clerkUserId: user.id, error })

    const { data: existing } = await supabase
      .from('app_users')
      .select('*')
      .eq('clerk_user_id', user.id)
      .maybeSingle<AppUserRecord>()

    return existing || null
  }

  return data
}

/**
 * Ensure the current Clerk user has a corresponding Supabase record
 */
export async function ensureCurrentAppUser(): Promise<AppUserRecord | null> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      logger.warn('Supabase service credentials missing; skipping user mapping')
      return null
    }

    const user = await safeCurrentUser()
    if (!user) {
      return null
    }

    const email = extractEmail(user)
    if (!email) {
      logger.warn('Authenticated Clerk user missing email address', { clerkUserId: user.id })
      return null
    }

    return await upsertAppUser(user, email)
  } catch (error) {
    logger.error('Failed to ensure app user mapping', { error })
    return null
  }
}

/**
 * Fetch the mapped Supabase record for the current Clerk user without mutating it
 */
export async function fetchCurrentAppUser(): Promise<AppUserRecord | null> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return null
    }

    const user = await safeCurrentUser()
    if (!user) {
      return null
    }

    const supabase = await createServiceRoleClient()
    const { data } = await supabase
      .from('app_users')
      .select('*')
      .eq('clerk_user_id', user.id)
      .maybeSingle<AppUserRecord>()

    return data || null
  } catch (error) {
    logger.error('Failed to fetch app user mapping', { error })
    return null
  }
}
