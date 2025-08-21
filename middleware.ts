import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { handleJudgeRedirects } from '@/lib/middleware/judge-redirects'

const isProtectedRoute = createRouteMatcher([
  '/profile(.*)',
  '/settings(.*)',
  '/dashboard(.*)',
  '/welcome(.*)',
])

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
])

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Handle judge name redirects first
  const judgeRedirect = handleJudgeRedirects(request)
  if (judgeRedirect) {
    return judgeRedirect
  }

  // Protect routes that require authentication
  if (isProtectedRoute(request)) {
    await auth.protect()
  }

  // Protect admin routes with additional checks
  if (isAdminRoute(request)) {
    await auth.protect()
    
    // Additional admin check would happen in the actual route handler
    // since middleware doesn't have access to full user data
  }

  return middleware(request)
}, {
  debug: process.env.NODE_ENV === 'development',
  clockSkewInMs: 10000
})

function middleware(request: NextRequest) {
  
  // Add security headers
  const response = NextResponse.next()
  
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Add CSP header for security
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.supabase.co *.clerk.accounts.dev https://*.clerk.com https://checkout.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://www.googleadservices.com https://partner.googleadservices.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' blob: data: *.supabase.co https://img.clerk.com https://images.clerk.dev https://images.unsplash.com https://www.courtlistener.com https://pagead2.googlesyndication.com https://www.google.com https://www.gstatic.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' *.supabase.co wss://*.supabase.co https://*.clerk.accounts.dev https://*.clerk.com wss://*.clerk.accounts.dev https://api.openai.com https://www.courtlistener.com https://api.stripe.com https://checkout.stripe.com https://www.google-analytics.com https://www.googletagmanager.com https://pagead2.googlesyndication.com",
    "frame-src https://*.clerk.accounts.dev https://*.clerk.com https://googleads.g.doubleclick.net https://www.google.com https://bid.g.doubleclick.net",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * But include protected API routes
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}