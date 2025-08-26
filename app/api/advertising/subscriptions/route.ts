import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { getOrCreateAdvertiserProfile } from '@/lib/auth/roles'
import { cancelSubscription, getSubscription } from '@/lib/stripe'

// GET - List all subscriptions for the current advertiser
export async function GET(request: NextRequest) {
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

    // Get all bookings with subscription IDs for this advertiser
    const { data: bookings, error } = await supabase
      .from('ad_bookings')
      .select(`
        *,
        ad_spots (
          *,
          judges:entity_id (
            name,
            court_level
          ),
          courts:entity_id (
            name
          )
        )
      `)
      .eq('advertiser_id', advertiserProfile.id)
      .not('stripe_subscription_id', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    // Enhance bookings with Stripe subscription status if needed
    const enhancedBookings = await Promise.all(
      (bookings || []).map(async (booking) => {
        if (booking.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
          try {
            const subscription = await getSubscription(booking.stripe_subscription_id)
            return {
              ...booking,
              stripe_status: subscription.status,
              current_period_end: (subscription as any).current_period_end
                ? new Date(((subscription as any).current_period_end as number) * 1000).toISOString()
                : null,
              cancel_at_period_end: subscription.cancel_at_period_end,
            }
          } catch (error) {
            console.error('Failed to fetch Stripe subscription:', error)
            return booking
          }
        }
        return booking
      })
    )

    return NextResponse.json({ subscriptions: enhancedBookings })
  } catch (error) {
    console.error('Error in GET /api/advertising/subscriptions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel a subscription
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const advertiserProfile = await getOrCreateAdvertiserProfile()
    if (!advertiserProfile) {
      return NextResponse.json({ error: 'Advertiser profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('booking_id')

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Get the booking to verify ownership and get subscription ID
    const { data: booking, error: bookingError } = await supabase
      .from('ad_bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('advertiser_id', advertiserProfile.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (!booking.stripe_subscription_id) {
      return NextResponse.json({ error: 'No subscription found for this booking' }, { status: 400 })
    }

    // Cancel the subscription in Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        await cancelSubscription(booking.stripe_subscription_id)
      } catch (stripeError) {
        console.error('Failed to cancel Stripe subscription:', stripeError)
        return NextResponse.json(
          { error: 'Failed to cancel subscription with payment provider' },
          { status: 500 }
        )
      }
    }

    // Update booking status in database
    const { error: updateError } = await supabase
      .from('ad_bookings')
      .update({
        booking_status: 'cancelled',
        payment_status: 'cancelled',
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Failed to update booking status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update booking status' },
        { status: 500 }
      )
    }

    // Free up the ad spot
    const { error: spotError } = await supabase
      .from('ad_spots')
      .update({
        status: 'available',
        current_advertiser_id: null,
      })
      .eq('id', booking.ad_spot_id)

    if (spotError) {
      console.error('Failed to update ad spot:', spotError)
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/advertising/subscriptions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}