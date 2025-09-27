import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getStripeClient, isStripeEnabled } from '@/lib/ads/stripe'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .min(5, 'Minimum donation is $5')
    .max(1000, 'Maximum donation is $1,000'),
  recurring: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  const started = Date.now()

  if (!isStripeEnabled()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid donation request' }, { status: 400 })
  }

  const { amount, recurring } = parsed.data
  logger.apiRequest('POST', '/api/donations/create', { amount, recurring })

  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe unavailable' }, { status: 503 })
  }

  const paymentLink = process.env.STRIPE_DONATION_PAYMENT_LINK
  if (paymentLink) {
    logger.apiResponse('POST', '/api/donations/create', 200, Date.now() - started, { method: 'payment_link' })
    return NextResponse.json({ url: paymentLink })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: recurring ? 'subscription' : 'payment',
      allow_promotion_codes: true,
      payment_method_types: ['card', 'us_bank_account'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: 'Support Transparency Donation',
              description: 'Support free judicial transparency for the public.',
            },
            recurring: recurring ? { interval: 'month' } : undefined,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'donation',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://judgefinder.io'}/thank-you?support=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://judgefinder.io'}/`,
    })

    logger.apiResponse('POST', '/api/donations/create', 200, Date.now() - started, { session: session.id })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    logger.apiResponse('POST', '/api/donations/create', 500, Date.now() - started, {
      error: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json({ error: 'Unable to create donation session' }, { status: 500 })
  }
}
