import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/auth/is-admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId || !(await isAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { type } = body

    if (!type || !['judges', 'courts', 'decisions'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid sync type. Must be judges, courts, or decisions' },
        { status: 400 }
      )
    }

    // For now, simulate sync operation
    // In a real implementation, this would trigger actual sync jobs
    console.log(`Triggering ${type} sync by admin user ${userId}`)

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: `${type} sync triggered successfully`,
      jobId: `sync-${type}-${Date.now()}`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Admin sync trigger error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
