import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { getOrCreateAdvertiserProfile } from '@/lib/auth/roles'
import { 
  createAdSpotCheckoutSession, 
  getOrCreateAdSpotProduct, 
  getOrCreateAdSpotPrice 
} from '@/lib/stripe'

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

    const body = await request.json()
    const {
      ad_spot_id,
      campaign_id,
      start_date,
      end_date,
      price_paid,
      duration_months
    } = body

    // Validate required fields
    if (!ad_spot_id || !start_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get the ad spot details with entity information
    const { data: spot, error: spotError } = await supabase
      .from('ad_spots')
      .select(`
        *,
        judges:entity_id (
          name,
          court_level
        ),
        courts:entity_id (
          name
        )
      `)
      .eq('id', ad_spot_id)
      .single()

    if (spotError || !spot) {
      return NextResponse.json({ error: 'Ad spot not found' }, { status: 404 })
    }

    if (spot.status !== 'available') {
      return NextResponse.json({ error: 'Ad spot is not available' }, { status: 400 })
    }

    // Determine entity details
    const entityName = spot.entity_type === 'judge' 
      ? spot.judges?.name 
      : spot.courts?.name
    const courtLevel = spot.entity_type === 'judge' 
      ? spot.judges?.court_level 
      : undefined

    if (!entityName) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    // Determine the monthly price based on entity type and court level
    const monthlyPrice = spot.entity_type === 'judge'
      ? (courtLevel === 'federal' ? 50000 : 20000) // $500 or $200 in cents
      : 20000 // Default $200 for courts

    // Create or get Stripe product and price
    const product = await getOrCreateAdSpotProduct({
      entityName,
      entityType: spot.entity_type,
      courtLevel: courtLevel as 'state' | 'federal' | undefined,
    })

    const price = await getOrCreateAdSpotPrice({
      productId: product.id,
      monthlyAmount: monthlyPrice,
    })

    // Create the booking record (initially pending)
    const { data: booking, error: bookingError } = await supabase
      .from('ad_bookings')
      .insert({
        ad_spot_id,
        campaign_id: campaign_id || null,
        advertiser_id: advertiserProfile.id,
        booking_status: 'pending',
        start_date,
        end_date: end_date || null,
        price_paid: monthlyPrice / 100, // Store in dollars
        payment_status: 'pending'
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Update the ad spot status to reserved
    await supabase
      .from('ad_spots')
      .update({
        status: 'reserved',
        current_advertiser_id: advertiserProfile.id
      })
      .eq('id', ad_spot_id)

    // Create Stripe checkout session
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const origin = request.headers.get('origin') || 'http://localhost:3005'
        const session = await createAdSpotCheckoutSession({
          priceId: price.id,
          advertiserId: advertiserProfile.id,
          adSpotId: ad_spot_id,
          successUrl: `${origin}/dashboard/advertiser?success=true&booking_id=${booking.id}`,
          cancelUrl: `${origin}/dashboard/advertiser?canceled=true`,
          metadata: {
            booking_id: booking.id,
            entity_name: entityName,
            entity_type: spot.entity_type,
            court_level: courtLevel || '',
            position: spot.position.toString(),
          },
        })

        return NextResponse.json({
          checkout_url: session.url,
          booking_id: booking.id,
          session_id: session.id,
        })
      } catch (stripeError) {
        console.error('Stripe error:', stripeError)
        
        // Clean up the booking if Stripe fails
        await supabase.from('ad_bookings').delete().eq('id', booking.id)
        await supabase
          .from('ad_spots')
          .update({ status: 'available', current_advertiser_id: null })
          .eq('id', ad_spot_id)

        return NextResponse.json(
          { error: 'Failed to create payment session' },
          { status: 500 }
        )
      }
    } else {
      // Development mode - no Stripe key configured
      // For demo, mark as confirmed immediately
      await supabase
        .from('ad_bookings')
        .update({
          booking_status: 'confirmed',
          payment_status: 'paid'
        })
        .eq('id', booking.id)

      await supabase
        .from('ad_spots')
        .update({ status: 'booked' })
        .eq('id', ad_spot_id)

      return NextResponse.json({
        success: true,
        booking_id: booking.id,
        message: 'Ad spot booked successfully (demo mode - no payment required)'
      })
    }
  } catch (error) {
    console.error('Error booking ad spot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}