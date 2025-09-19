import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { resolveAdminStatus } from './is-admin'

// User role types
export type UserRole = 'admin' | 'law_firm' | 'attorney' | 'advertiser' | 'user'

/**
 * Get the current user's role
 */
export async function getUserRole(): Promise<UserRole> {
  try {
    const user = await currentUser()
    if (!user) return 'user'

    const { isAdmin } = await resolveAdminStatus()
    if (isAdmin) {
      return 'admin'
    }

    // Check for advertiser role in Clerk metadata
    const publicMetadata = user.publicMetadata as { role?: UserRole }
    if (publicMetadata?.role) {
      return publicMetadata.role
    }

    // Check if user has an advertiser profile in Supabase
    const supabase = await createServerClient()
    const { data: advertiserProfile } = await supabase
      .from('advertiser_profiles')
      .select('id, firm_type')
      .eq('user_id', user.id)
      .single()

    if (advertiserProfile) {
      // Determine specific advertiser role based on firm type
      if (advertiserProfile.firm_type === 'solo') {
        return 'attorney'
      } else {
        return 'law_firm'
      }
    }

    return 'user'
  } catch (error) {
    console.error('Error getting user role:', error)
    return 'user'
  }
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'admin'
}

/**
 * Check if the current user is an advertiser (law firm or attorney)
 */
export async function isAdvertiser(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) {
    return false
  }

  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('advertiser_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.warn('Error checking advertiser profile:', error)
      return false
    }

    return Boolean(data)
  } catch (error) {
    console.error('Unexpected error checking advertiser status:', error)
    return false
  }
}

/**
 * Update user role in Clerk metadata
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  try {
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: role
      }
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    throw error
  }
}

/**
 * Get user permissions based on role
 */
export function getRolePermissions(role: UserRole) {
  const permissions = {
    admin: {
      can_create_campaigns: true,
      can_manage_billing: true,
      can_view_analytics: true,
      can_book_spots: true,
      can_approve_campaigns: true,
      can_manage_all_advertisers: true,
      can_view_revenue_reports: true,
      can_manage_ad_spots: true
    },
    law_firm: {
      can_create_campaigns: true,
      can_manage_billing: true,
      can_view_analytics: true,
      can_book_spots: true,
      can_approve_campaigns: false,
      can_manage_all_advertisers: false,
      can_view_revenue_reports: false,
      can_manage_ad_spots: false
    },
    attorney: {
      can_create_campaigns: true,
      can_manage_billing: true,
      can_view_analytics: true,
      can_book_spots: true,
      can_approve_campaigns: false,
      can_manage_all_advertisers: false,
      can_view_revenue_reports: false,
      can_manage_ad_spots: false
    },
    advertiser: {
      can_create_campaigns: true,
      can_manage_billing: true,
      can_view_analytics: true,
      can_book_spots: true,
      can_approve_campaigns: false,
      can_manage_all_advertisers: false,
      can_view_revenue_reports: false,
      can_manage_ad_spots: false
    },
    user: {
      can_create_campaigns: false,
      can_manage_billing: false,
      can_view_analytics: false,
      can_book_spots: false,
      can_approve_campaigns: false,
      can_manage_all_advertisers: false,
      can_view_revenue_reports: false,
      can_manage_ad_spots: false
    }
  }

  return permissions[role]
}

/**
 * Require advertiser access - throws error if not advertiser
 */
export async function requireAdvertiser(): Promise<void> {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const isUserAdvertiser = await isAdvertiser()
  if (!isUserAdvertiser) {
    throw new Error('Advertiser access required')
  }
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
 * Get or create advertiser profile for current user
 */
export async function getOrCreateAdvertiserProfile(userData?: {
  firm_name: string
  firm_type: 'solo' | 'small' | 'medium' | 'large' | 'enterprise'
  contact_email: string
  bar_number?: string
  bar_state?: string
}) {
  const user = await currentUser()
  if (!user) throw new Error('User not authenticated')

  const supabase = await createServerClient()

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('advertiser_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (existingProfile) {
    return existingProfile
  }

  // Create new profile if userData provided
  if (userData) {
    const { data: newProfile, error } = await supabase
      .from('advertiser_profiles')
      .insert({
        user_id: user.id,
        ...userData,
        account_status: 'pending',
        verification_status: 'unverified'
      })
      .select()
      .single()

    if (error) throw error

    // Update user role in Clerk
    const role = userData.firm_type === 'solo' ? 'attorney' : 'law_firm'
    await updateUserRole(user.id, role)

    return newProfile
  }

  return null
}
