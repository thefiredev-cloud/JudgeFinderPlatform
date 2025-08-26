import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Get booking details from metadata
        const bookingId = session.metadata?.booking_id
        const advertiserId = session.metadata?.advertiser_id
        const adSpotId = session.metadata?.ad_spot_id
        
        if (!bookingId || !advertiserId || !adSpotId) {
          console.error('Missing required metadata in checkout session:', session.id)
          break
        }

        // Update booking status
        const { error: bookingError } = await supabase
          .from('ad_bookings')
          .update({
            booking_status: 'confirmed',
            payment_status: 'paid',
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq('id', bookingId)

        if (bookingError) {
          console.error('Failed to update booking:', bookingError)
          break
        }

        // Update ad spot status
        const { error: spotError } = await supabase
          .from('ad_spots')
          .update({
            status: 'booked',
            current_advertiser_id: advertiserId,
          })
          .eq('id', adSpotId)

        if (spotError) {
          console.error('Failed to update ad spot:', spotError)
          break
        }

        // Store Stripe customer ID in advertiser profile if not already present
        if (session.customer) {
          await supabase
            .from('advertiser_profiles')
            .update({
              stripe_customer_id: session.customer as string,
            })
            .eq('id', advertiserId)
            .is('stripe_customer_id', null)
        }

        // Store subscription ID if present
        if (session.subscription) {
          await supabase
            .from('ad_bookings')
            .update({
              stripe_subscription_id: session.subscription as string,
            })
            .eq('id', bookingId)
        }

        console.log('Checkout completed for booking:', bookingId)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        // This handles recurring subscription payments
        const subscriptionId = (invoice as any).subscription
        if (subscriptionId && invoice.billing_reason === 'subscription_cycle') {
          
          // Find the booking associated with this subscription
          const { data: booking, error: findError } = await supabase
            .from('ad_bookings')
            .select('*')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (findError || !booking) {
            console.error('Booking not found for subscription:', subscriptionId)
            break
          }

          // Update end date to extend by one month
          const currentEndDate = new Date(booking.end_date)
          const newEndDate = new Date(currentEndDate)
          newEndDate.setMonth(newEndDate.getMonth() + 1)

          await supabase
            .from('ad_bookings')
            .update({
              end_date: newEndDate.toISOString().split('T')[0],
              payment_status: 'paid',
              stripe_invoice_id: invoice.id,
            })
            .eq('id', booking.id)

          console.log('Subscription renewed for booking:', booking.id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        const subscriptionId = (invoice as any).subscription
        if (subscriptionId) {
          
          // Find and update the booking
          const { data: booking, error: findError } = await supabase
            .from('ad_bookings')
            .select('*')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (!findError && booking) {
            await supabase
              .from('ad_bookings')
              .update({
                payment_status: 'failed',
              })
              .eq('id', booking.id)

            // Update ad spot to show it's at risk
            await supabase
              .from('ad_spots')
              .update({
                status: 'reserved', // Change from booked to reserved when payment fails
              })
              .eq('id', booking.ad_spot_id)

            console.log('Payment failed for booking:', booking.id)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Find the booking associated with this subscription
        const { data: booking, error: findError } = await supabase
          .from('ad_bookings')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (!findError && booking) {
          // Update booking status
          await supabase
            .from('ad_bookings')
            .update({
              booking_status: 'cancelled',
              payment_status: 'cancelled',
            })
            .eq('id', booking.id)

          // Free up the ad spot
          await supabase
            .from('ad_spots')
            .update({
              status: 'available',
              current_advertiser_id: null,
            })
            .eq('id', booking.ad_spot_id)

          console.log('Subscription cancelled for booking:', booking.id)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Handle subscription status changes
        const { data: booking, error: findError } = await supabase
          .from('ad_bookings')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (!findError && booking) {
          let bookingStatus = booking.booking_status
          let paymentStatus = booking.payment_status

          switch (subscription.status) {
            case 'active':
              bookingStatus = 'active'
              paymentStatus = 'paid'
              break
            case 'past_due':
              paymentStatus = 'past_due'
              break
            case 'canceled':
              bookingStatus = 'cancelled'
              paymentStatus = 'cancelled'
              break
            case 'unpaid':
              paymentStatus = 'unpaid'
              break
          }

          await supabase
            .from('ad_bookings')
            .update({
              booking_status: bookingStatus,
              payment_status: paymentStatus,
            })
            .eq('id', booking.id)

          // Update ad spot status based on subscription status
          if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            await supabase
              .from('ad_spots')
              .update({
                status: 'available',
                current_advertiser_id: null,
              })
              .eq('id', booking.ad_spot_id)
          }

          console.log('Subscription updated for booking:', booking.id, 'Status:', subscription.status)
        }
        break
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Note: Next.js 14 App Router automatically handles raw body for webhooks