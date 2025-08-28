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
  const response = NextResponse.next()
  
  // Enhanced Security Headers for Production
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  
  // HSTS for HTTPS enforcement (production only)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
  
  // Permissions Policy to restrict browser APIs
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'midi=()',
    'sync-xhr=()',
    'fullscreen=(self)',
    'autoplay=()',
  ].join(', ')
  response.headers.set('Permissions-Policy', permissionsPolicy)
  
  // Enhanced CSP with production-ready security
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Common script sources for both environments
  const scriptSources = [
    "'self'",
    "'unsafe-inline'", // Required for Next.js inline scripts
    "*.supabase.co",
    "*.clerk.accounts.dev", 
    "https://*.clerk.com",
    "https://*.clerk.accounts.dev",
    "https://clerk.shared.lcl.dev",
    "https://clerk.judgefinder.io",
    "https://cdn.jsdelivr.net",
    "https://checkout.stripe.com",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com", 
    "https://www.clarity.ms",
    "https://pagead2.googlesyndication.com",
    "https://www.googleadservices.com",
    "https://partner.googleadservices.com",
    "https://challenges.cloudflare.com"
  ]
  
  // Add development-specific sources
  if (isDevelopment) {
    scriptSources.push("'unsafe-eval'") // Required for hot reload in dev
  } else {
    scriptSources.push("'sha256-4RS22DYeB7U14dra4KcQYxmwt5HkOInieXK1NUMBmQI='") // Specific inline script hash
  }
  
  const csp = [
    "default-src 'self'",
    `script-src ${scriptSources.join(' ')}`,
    `script-src-elem ${scriptSources.join(' ')}`, // Explicit directive to prevent fallback issues
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com", // Explicit directive for styles
    "img-src 'self' blob: data: *.supabase.co https://img.clerk.com https://images.clerk.dev https://uploadthing.com https://images.unsplash.com https://www.courtlistener.com https://pagead2.googlesyndication.com https://www.google.com https://www.gstatic.com https://c.bing.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' *.supabase.co wss://*.supabase.co https://*.clerk.accounts.dev https://*.clerk.com wss://*.clerk.accounts.dev https://clerk.shared.lcl.dev https://clerk.judgefinder.io wss://clerk.judgefinder.io https://cdn.jsdelivr.net https://api.openai.com https://www.courtlistener.com https://api.stripe.com https://checkout.stripe.com https://www.google-analytics.com https://www.googletagmanager.com https://www.clarity.ms https://pagead2.googlesyndication.com https://challenges.cloudflare.com",
    "frame-src https://*.clerk.accounts.dev https://*.clerk.com https://clerk.judgefinder.io https://googleads.g.doubleclick.net https://www.google.com https://bid.g.doubleclick.net https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' *.clerk.accounts.dev *.clerk.com clerk.judgefinder.io",
    "object-src 'none'",
    ...(process.env.NODE_ENV === 'production' ? [
      "upgrade-insecure-requests",
      "block-all-mixed-content"
    ] : [])
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  // Cache control for different resource types
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/api/')) {
    // API responses - no cache for dynamic content
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  } else if (pathname.includes('/_next/static/')) {
    // Static assets - long cache
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else if (pathname.includes('/_next/image/')) {
    // Optimized images - moderate cache
    response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=31536000')
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