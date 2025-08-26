import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { priceId, judgeId, slotId } = body

    console.log('[Attorney Slots] Claim request:', { priceId, judgeId, slotId })

    if (!priceId || !judgeId || !slotId) {
      console.error('[Attorney Slots] Missing required fields:', { priceId: !!priceId, judgeId: !!judgeId, slotId: !!slotId })
      return NextResponse.json({ error: 'Missing priceId, judgeId or slotId' }, { status: 400 })
    }

    if (!stripe) {
      console.error('[Attorney Slots] Stripe is not configured')
      return NextResponse.json({ error: 'Payment system is not configured' }, { status: 503 })
    }

    const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')

    const tier = priceId === (process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FEDERAL || '') ? 'federal' : 'state_local'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing`,
      customer_creation: 'always',
      allow_promotion_codes: true,
      metadata: {
        judge_id: String(judgeId),
        slot_id: String(slotId),
        tier,
      },
    })

    return NextResponse.json({ id: session.id, url: session.url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Stripe error' }, { status: 400 })
  }
}


