/**
 * Security headers configuration for JudgeFinder Platform
 * Implements OWASP security best practices for judicial transparency tool
 */

export interface SecurityConfig {
  environment: 'development' | 'production' | 'staging'
  domain: string
  enableHSTS: boolean
  enableCSP: boolean
  reportCSPViolations: boolean
}

/**
 * Generate Content Security Policy based on environment
 */
export function generateCSP(config: SecurityConfig): string {
  const isDev = config.environment === 'development'
  
  const policies = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      "'unsafe-inline'", // Required for Next.js inline scripts
      "*.supabase.co",
      "*.clerk.accounts.dev",
      "https://*.clerk.com",
      "https://*.clerk.accounts.dev",
      "https://clerk.shared.lcl.dev",
      "https://clerk.judgefinder.io",
      "https://cdn.jsdelivr.net",

      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://www.clarity.ms",
      "https://pagead2.googlesyndication.com",
      "https://www.googleadservices.com",
      "https://partner.googleadservices.com",
      "https://challenges.cloudflare.com"
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS
      "https://fonts.googleapis.com"
    ],
    'img-src': [
      "'self'",
      "data:",
      "blob:",
      "*.supabase.co",
      "https://img.clerk.com",
      "https://images.clerk.dev",
      "https://uploadthing.com",
      "https://images.unsplash.com",
      "https://www.courtlistener.com",
      "https://pagead2.googlesyndication.com",
      "https://www.google.com",
      "https://www.gstatic.com",
      "https://c.bing.com"
    ],
    'font-src': [
      "'self'",
      "data:",
      "https://fonts.gstatic.com"
    ],
    'connect-src': [
      "'self'",
      "*.supabase.co",
      "wss://*.supabase.co",
      "https://*.clerk.accounts.dev",
      "https://*.clerk.com",
      "wss://*.clerk.accounts.dev",
      "https://clerk.shared.lcl.dev",
      "https://clerk.judgefinder.io",
      "wss://clerk.judgefinder.io",
      "https://cdn.jsdelivr.net",
      "https://api.openai.com",
      "https://www.courtlistener.com",

      "https://www.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://www.clarity.ms",
      "https://pagead2.googlesyndication.com",
      "https://challenges.cloudflare.com",
      ...(isDev ? ["http://localhost:*", "ws://localhost:*"] : [])
    ],
    'frame-src': [
      "https://*.clerk.accounts.dev",
      "https://*.clerk.com",
      "https://clerk.judgefinder.io",
      "https://googleads.g.doubleclick.net",
      "https://www.google.com",
      "https://bid.g.doubleclick.net",
      "https://challenges.cloudflare.com"
    ],
    'worker-src': [
      "'self'",
      "blob:"
    ],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': [
      "'self'",
      "*.clerk.accounts.dev",
      "*.clerk.com",
      "clerk.judgefinder.io"
    ],
    'object-src': ["'none'"],
    ...(config.environment === 'production' ? {
      'upgrade-insecure-requests': [],
      'block-all-mixed-content': []
    } : {})
  }

  // Convert to CSP string format
  return Object.entries(policies)
    .map(([directive, sources]) => 
      sources.length > 0 
        ? `${directive} ${sources.join(' ')}`
        : directive
    )
    .join('; ')
}

/**
 * Security headers for judicial transparency platform
 */
export function getSecurityHeaders(config: SecurityConfig) {
  const headers: Record<string, string> = {
    // Basic security headers
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-DNS-Prefetch-Control': 'on',
    
    // Permissions Policy - restrict unnecessary browser APIs
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'midi=()',
      'sync-xhr=()',
      'fullscreen=(self)',
      'autoplay=()'
    ].join(', '),
    
    // Expect-CT for certificate transparency
    'Expect-CT': `max-age=86400, enforce, report-uri="https://${config.domain}/api/security/ct-report"`,
    
    // Feature Policy (legacy support)
    'Feature-Policy': [
      "camera 'none'",
      "microphone 'none'",
      "geolocation 'none'",
      "payment 'none'"
    ].join('; ')
  }

  // Production-only headers
  if (config.environment === 'production' && config.enableHSTS) {
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload'
  }

  // Content Security Policy
  if (config.enableCSP) {
    headers['Content-Security-Policy'] = generateCSP(config)
    
    // CSP Reporting (production only)
    if (config.reportCSPViolations && config.environment === 'production') {
      headers['Content-Security-Policy-Report-Only'] = 
        generateCSP(config) + `; report-uri https://${config.domain}/api/security/csp-report`
    }
  }

  return headers
}

/**
 * Cache control headers for different resource types
 */
export function getCacheHeaders(pathname: string): Record<string, string> {
  // API routes - no cache
  if (pathname.startsWith('/api/')) {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
  
  // Static assets - long cache
  if (pathname.includes('/_next/static/') || /\.(css|js|ico|png|jpg|jpeg|gif|svg|woff|woff2)$/.test(pathname)) {
    return {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  }
  
  // Judge profiles - medium cache
  if (pathname.startsWith('/judges/')) {
    return {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  }
  
  // Courts pages - longer cache
  if (pathname.startsWith('/courts/')) {
    return {
      'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=86400'
    }
  }
  
  // Default for other pages
  return {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
  }
}

/**
 * CORS headers for API endpoints
 */
export function getCORSHeaders(config: SecurityConfig): Record<string, string> {
  const allowedOrigins = config.environment === 'production' 
    ? [`https://${config.domain}`]
    : ['http://localhost:3005', 'http://localhost:3000']
    
  return {
    'Access-Control-Allow-Origin': allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  }
}

/**
 * Security configuration factory
 */
export function createSecurityConfig(): SecurityConfig {
  const environment = (process.env.NODE_ENV as SecurityConfig['environment']) || 'development'
  const domain = environment === 'production' 
    ? 'judgefinder.io' 
    : 'localhost:3005'
    
  return {
    environment,
    domain,
    enableHSTS: environment === 'production',
    enableCSP: true,
    reportCSPViolations: environment === 'production'
  }
}