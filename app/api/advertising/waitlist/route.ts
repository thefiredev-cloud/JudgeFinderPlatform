import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  entity_type: z.enum(['judge', 'court']),
  entity_id: z.string().uuid(),
  email: z.string().email(),
  firm_name: z.string().min(1).max(200),
})

export async function POST(request: NextRequest) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid payload' }, { status: 400 })
  }

  const { entity_type, entity_id, email, firm_name } = parsed.data

  try {
    const supabase = await createServerClient()
    const { error } = await supabase.from('ad_waitlist').insert({
      entity_type,
      entity_id,
      email,
      firm_name,
    })

    if (error) {
      logger.error('waitlist insert failed', { error: error.message })
      return NextResponse.json({ error: 'Unable to join waitlist' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
