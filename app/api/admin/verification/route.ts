import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, status, notes } = await req.json()
    if (!userId || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // Require admin role
    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await supabase.from('attorneys').update({ verification_status: status, verification_notes: notes || null, verified: status === 'verified' }).eq('user_id', userId)
    await supabase.from('law_firms').update({ is_verified: status === 'verified' }).eq('user_id', userId)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 })
  }
}


