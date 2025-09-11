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

// Check if Clerk is properly configured (only check public key for client-side safety)
const hasValidClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                          !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('YOUR_') &&
                          !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('CONFIGURE')

// Only use Clerk middleware if keys are configured
const middlewareHandler = hasValidClerkKeys 
  ? clerkMiddleware(async (auth, request: NextRequest) => {
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
      }

      return middleware(request)
    }, {
      debug: process.env.NODE_ENV === 'development',
      clockSkewInMs: 10000
    })
  : (request: NextRequest) => {
      // Handle judge name redirects even without Clerk
      const judgeRedirect = handleJudgeRedirects(request)
      if (judgeRedirect) {
        return judgeRedirect
      }
      
      return middleware(request)
    }

export default middlewareHandler

function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Basic Security Headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // HSTS for HTTPS enforcement (production only)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  // Basic CSP for essential services only
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${isDevelopment ? "'unsafe-eval'" : ""} *.supabase.co *.clerk.com *.clerk.accounts.dev https://www.googletagmanager.com https://www.google-analytics.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' blob: data: *.supabase.co https://img.clerk.com https://images.clerk.dev https://www.courtlistener.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' *.supabase.co wss://*.supabase.co *.clerk.com *.clerk.accounts.dev https://api.openai.com https://www.courtlistener.com https://www.google-analytics.com https://www.googletagmanager.com https://generativelanguage.googleapis.com",
    "frame-src *.clerk.com *.clerk.accounts.dev",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' *.clerk.com *.clerk.accounts.dev",
    "object-src 'none'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  // Basic cache control
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  } else if (pathname.includes('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  
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