import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { getOrCreateAdvertiserProfile } from '@/lib/auth/roles'
import { createCustomerPortalSession } from '@/lib/stripe'

// POST - Create a Stripe Customer Portal session for managing subscriptions
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const advertiserProfile = await getOrCreateAdvertiserProfile()
    if (!advertiserProfile) {
      return NextResponse.json({ error: 'Advertiser profile not found' }, { status: 404 })
    }

    const supabase = await createServerClient()

    // Get the advertiser's Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('advertiser_profiles')
      .select('stripe_customer_id')
      .eq('id', advertiserProfile.id)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscriptions found. Please make a purchase first.' },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment system is not configured' },
        { status: 500 }
      )
    }

    // Create a portal session
    const origin = request.headers.get('origin') || 'http://localhost:3005'
    const session = await createCustomerPortalSession({
      customerId: profile.stripe_customer_id,
      returnUrl: `${origin}/dashboard/advertiser`,
    })

    return NextResponse.json({
      portal_url: session.url,
    })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}