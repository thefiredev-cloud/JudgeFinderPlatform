import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // This route exists only to give Supabase a redirect URL; the auth cookie will be set by Supabase
  const url = new URL(request.url)
  const redirectTo = url.searchParams.get('redirectTo') || '/'
  // Optionally hydrate a user profile row on first sign-in
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const meta: any = user.user_metadata || {}
      const role = meta?.account_type === 'attorney' ? 'attorney' : 'user'
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        full_name: meta?.full_name || null,
        role,
      }, { onConflict: 'id' })
    }
  } catch (_) {}
  return NextResponse.redirect(new URL(redirectTo, request.url))
}


