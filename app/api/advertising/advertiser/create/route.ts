import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { updateUserRole } from '@/lib/auth/roles'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    const user = await currentUser()
    
    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      firm_name,
      firm_type,
      contact_email,
      contact_phone,
      bar_number,
      bar_state,
      website,
      description,
      specializations,
      billing_email,
      billing_address
    } = body

    // Validate required fields
    if (!firm_name || !firm_type || !contact_email || !bar_number || !bar_state) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Check if advertiser profile already exists
    const { data: existingProfile } = await supabase
      .from('advertiser_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Advertiser profile already exists' },
        { status: 400 }
      )
    }

    // Create advertiser profile
    const { data: profile, error: profileError } = await supabase
      .from('advertiser_profiles')
      .insert({
        user_id: userId,
        firm_name,
        firm_type,
        contact_email,
        contact_phone,
        bar_number,
        bar_state,
        website,
        description,
        specializations,
        billing_email: billing_email || contact_email,
        billing_address,
        account_status: 'pending',
        verification_status: 'pending' // Will be verified after bar number check
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating advertiser profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to create advertiser profile' },
        { status: 500 }
      )
    }

    // Update user role in Clerk
    const role = firm_type === 'solo' ? 'attorney' : 'law_firm'
    await updateUserRole(userId, role)

    // TODO: In production, verify bar number with state bar API
    // For now, auto-approve for demo
    if (bar_number && bar_state === 'CA') {
      await supabase
        .from('advertiser_profiles')
        .update({
          verification_status: 'verified',
          account_status: 'active'
        })
        .eq('id', profile.id)
    }

    return NextResponse.json({
      success: true,
      profile_id: profile.id,
      message: 'Advertiser profile created successfully'
    })
  } catch (error) {
    console.error('Error creating advertiser profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}