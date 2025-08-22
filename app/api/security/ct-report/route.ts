/**
 * Certificate Transparency reporting endpoint
 * Monitors certificate transparency compliance
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log Certificate Transparency violation
    console.warn('Certificate Transparency Report:', {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      report: body,
      url: request.url,
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    })
    
    // In production, send to security monitoring
    if (process.env.NODE_ENV === 'production') {
      // Example: Alert security team or monitoring service
      // await notifySecurityTeam(body)
    }
    
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Error processing CT report:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
      'Content-Type': 'application/json',
    },
  })
}