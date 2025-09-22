import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import type { NextFetchEvent, NextRequest } from 'next/server'
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
const clerkWrappedHandler = hasValidClerkKeys
  ? clerkMiddleware(async (auth, request: NextRequest) => {
      const judgeRedirect = handleJudgeRedirects(request)
      if (judgeRedirect) {
        return judgeRedirect
      }

      if (isProtectedRoute(request)) {
        await auth.protect()
      }

      if (isAdminRoute(request)) {
        await auth.protect()
      }

      return baseMiddleware(request)
    }, {
      debug: process.env.NODE_ENV === 'development',
      clockSkewInMs: 10000
    })
  : null

const middlewareHandler = clerkWrappedHandler
  ? async (request: NextRequest, event: NextFetchEvent) => {
      try {
        return await clerkWrappedHandler(request, event)
      } catch (error) {
        console.warn('[middleware] Clerk middleware failed; falling back to base handler', error)
        return baseMiddleware(request)
      }
    }
  : async (request: NextRequest) => {
      const judgeRedirect = handleJudgeRedirects(request)
      if (judgeRedirect) {
        return judgeRedirect
      }

      return baseMiddleware(request)
    }

const sentryWrapper = typeof (Sentry as any)?.withSentryMiddleware === 'function'
  ? (Sentry as any).withSentryMiddleware.bind(Sentry)
  : null

const sentryWrappedHandler = (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)
  ? (sentryWrapper ? sentryWrapper(middlewareHandler) : middlewareHandler)
  : middlewareHandler

export default function handler(request: NextRequest, event: NextFetchEvent) {
  return sentryWrappedHandler(request, event)
}

function baseMiddleware(request: NextRequest) {
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
  
  const reportEndpoint = `${request.nextUrl.origin}/api/security/csp-report`

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${isDevelopment ? "'unsafe-eval'" : ""} *.supabase.co *.clerk.com *.clerk.accounts.dev https://www.googletagmanager.com https://www.google-analytics.com https://browser.sentry-cdn.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' blob: data: *.supabase.co https://img.clerk.com https://images.clerk.dev https://www.courtlistener.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' *.supabase.co wss://*.supabase.co *.clerk.com *.clerk.accounts.dev https://api.openai.com https://www.courtlistener.com https://www.google-analytics.com https://www.googletagmanager.com https://generativelanguage.googleapis.com https://o.sentry.io https://*.ingest.sentry.io https://*.sentry.io",
    "frame-src *.clerk.com *.clerk.accounts.dev",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' *.clerk.com *.clerk.accounts.dev",
    "object-src 'none'",
    'report-to csp-endpoint'
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('Report-To', JSON.stringify({
    group: 'csp-endpoint',
    max_age: 10886400,
    endpoints: [
      { url: reportEndpoint }
    ]
  }))
  response.headers.set('Reporting-Endpoints', `csp-endpoint="${reportEndpoint}"`)
  
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
