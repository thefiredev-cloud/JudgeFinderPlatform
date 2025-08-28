import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'

export async function createServerClient(): Promise<SupabaseClient> {
  try {
    const cookieStore = await cookies()

    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    return createSupabaseServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {}
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {}
          },
        },
      }
    )
  } catch (error) {
    console.error('Failed to create Supabase server client:', error)
    throw error
  }
}

export async function createClerkSupabaseServerClient(): Promise<SupabaseClient> {
  const { getToken } = await auth()
  const token = await getToken({ template: 'supabase' })

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      cookies: {
        get() { return '' },
        set() {},
        remove() {},
      },
    }
  )
}

export async function createServiceRoleClient(): Promise<SupabaseClient> {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() {
          return ''
        },
        set() {},
        remove() {},
      },
    }
  )
}