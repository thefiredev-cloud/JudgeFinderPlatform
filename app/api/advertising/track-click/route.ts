import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const payloadSchema = z.object({
  slot_id: z.string().uuid(),
  judge_id: z.string().uuid().optional(),
  court_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = payloadSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Increment click counters for spot and optionally record event
    await supabase.rpc('increment_ad_spot_clicks', { p_spot_id: parsed.data.slot_id }).catch(() => undefined)

    await supabase.from('ad_click_events').insert({
      ad_spot_id: parsed.data.slot_id,
      judge_id: parsed.data.judge_id || null,
      court_id: parsed.data.court_id || null,
      user_agent: request.headers.get('user-agent') || null,
      ip_hash: null,
    }).catch(() => undefined)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}


