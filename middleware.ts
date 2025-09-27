import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { ensureCurrentAppUser } from '@/lib/auth/user-mapping'
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

const clerkKeys = {
  publishable: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  secret: process.env.CLERK_SECRET_KEY
}

const isProduction = process.env.NODE_ENV === 'production'
const hasConfiguredClerkKeys = Boolean(
  clerkKeys.publishable &&
  clerkKeys.secret &&
  clerkKeys.publishable.startsWith('pk_') &&
  !clerkKeys.publishable.includes('YOUR_') &&
  !clerkKeys.publishable.includes('CONFIGURE')
)

if (isProduction && !hasConfiguredClerkKeys) {
  throw new Error('Clerk keys are missing or invalid in production environment')
}

const hasValidClerkKeys = hasConfiguredClerkKeys
  ? clerkKeys.publishable &&
    clerkKeys.secret &&
    clerkKeys.publishable.startsWith('pk_') &&
    !clerkKeys.publishable.includes('YOUR_') &&
    !clerkKeys.publishable.includes('CONFIGURE')
  : null

if (!hasValidClerkKeys) {
  console.warn('[middleware] Clerk keys missing or invalid; authentication disabled for public routes', {
    publishableConfigured: Boolean(clerkKeys.publishable),
    environment: process.env.NODE_ENV
  })
}

// Only use Clerk middleware if keys are configured
const clerkWrappedHandler = hasValidClerkKeys
  ? clerkMiddleware(async (auth, request: NextRequest) => {
      const judgeRedirect = handleJudgeRedirects(request)
      if (judgeRedirect) {
        return judgeRedirect
      }

      if (isProtectedRoute(request)) {
        await auth.protect()
        // Best-effort user mapping; don't block response on failure
        try { await ensureCurrentAppUser() } catch {}
      }

      if (isAdminRoute(request)) {
        await auth.protect()
        // Ensure mapping for admins too
        try { await ensureCurrentAppUser() } catch {}
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

export default function handler(request: NextRequest, event: NextFetchEvent) {
  return middlewareHandler(request, event)
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
  } else if (pathname.startsWith('/judges') || pathname.startsWith('/courts')) {
    // Never cache SSR HTML for dynamic pages that include asset hashes in output
    response.headers.set('Cache-Control', 'no-store')
  } else {
    // Default: do not cache HTML documents to avoid stale pages referencing old asset hashes
    response.headers.set('Cache-Control', 'no-store')
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
