import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClerkSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test Supabase connection with Clerk JWT
    const supabase = await createClerkSupabaseServerClient()
    
    // Test a simple query
    const { data, error } = await supabase
      .from('judges')
      .select('id, name')
      .limit(1)

    return NextResponse.json({
      success: true,
      clerk: {
        userId: user?.id,
        email: user?.emailAddresses[0]?.emailAddress,
        firstName: user?.firstName,
        lastName: user?.lastName,
      },
      supabase: {
        connected: !error,
        error: error?.message,
        sampleData: data,
      },
    })
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}