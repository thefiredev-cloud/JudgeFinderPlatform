/**
 * Content Security Policy violation reporting endpoint
 * Logs CSP violations for security monitoring
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log CSP violation for monitoring
    console.warn('CSP Violation Report:', {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      violation: body['csp-report'] || body,
      url: request.url,
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    })
    
    // In production, you might want to send this to a monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, DataDog, or other monitoring service
      // await sendToMonitoringService(body)
    }
    
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Error processing CSP report:', error)
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