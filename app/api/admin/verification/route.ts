import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/auth/is-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { userId, status, notes } = await req.json()
    if (!userId || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId || !(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const supabase = await createServerClient()
    await supabase.from('attorneys').update({ verification_status: status, verification_notes: notes || null, verified: status === 'verified' }).eq('user_id', userId)
    await supabase.from('law_firms').update({ is_verified: status === 'verified' }).eq('user_id', userId)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 })
  }
}


