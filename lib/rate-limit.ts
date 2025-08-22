import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create Redis instance for rate limiting
// In development without Redis, skip rate limiting entirely to avoid errors
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// In development without Redis, rate limiting is disabled
const isRateLimitingEnabled = redis !== null

// Rate limiting configurations for different endpoints
// Only create rate limiters if Redis is available
export const rateLimits = {
  // Search endpoints - moderate rate limiting
  search: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute
    analytics: true,
    prefix: 'ratelimit:search',
  }) : null,

  // Judge profile views - higher limit for browsing
  judgeProfile: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
    analytics: true,
    prefix: 'ratelimit:judge',
  }) : null,

  // Advanced search - more resource intensive, lower limit
  advancedSearch: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    analytics: true,
    prefix: 'ratelimit:advanced',
  }) : null,

  // API endpoints for data synchronization - very restricted
  sync: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 requests per hour
    analytics: true,
    prefix: 'ratelimit:sync',
  }) : null,

  // Webhook endpoints - moderate protection
  webhook: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute
    analytics: true,
    prefix: 'ratelimit:webhook',
  }) : null,

  // Authentication endpoints - protect against brute force
  auth: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    analytics: true,
    prefix: 'ratelimit:auth',
  }) : null,

  // General API endpoints - reasonable default
  api: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
    prefix: 'ratelimit:api',
  }) : null,

  // Admin endpoints - more lenient for authenticated admins
  admin: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, '1 m'), // 200 requests per minute
    analytics: true,
    prefix: 'ratelimit:admin',
  }) : null,
}

// Rate limiting helper function
export async function checkRateLimit(
  identifier: string,
  rateLimitType: keyof typeof rateLimits
) {
  const rateLimit = rateLimits[rateLimitType]
  
  // If rate limiting is not enabled (no Redis), always allow requests
  if (!rateLimit || !isRateLimitingEnabled) {
    return {
      success: true,
      limit: 0,
      reset: 0,
      remaining: 0,
      headers: {}
    }
  }
  
  try {
    const { success, limit, reset, remaining } = await rateLimit.limit(identifier)
    
    return {
      success,
      limit,
      reset,
      remaining,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString(),
      }
    }
  } catch (error) {
    // Log the error and block the request for security (fail closed)
    console.error('Rate limiting error:', error)
    return {
      success: false, // SECURITY: Fail closed - block request if rate limiting fails
      limit: 0,
      reset: Date.now() + 60000, // Reset in 1 minute
      remaining: 0,
      headers: {
        'X-RateLimit-Error': 'Rate limiting service unavailable'
      }
    }
  }
}

// Get identifier for rate limiting (IP or user ID)
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  // Use user ID if authenticated, otherwise use IP address
  if (userId) {
    return `user:${userId}`
  }

  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'
  return `ip:${ip}`
}

// Rate limiting middleware for API routes
export function withRateLimit(rateLimitType: keyof typeof rateLimits) {
  return async function rateLimitMiddleware(
    request: Request,
    handler: (request: Request) => Promise<Response>,
    userId?: string
  ): Promise<Response> {
    const identifier = getRateLimitIdentifier(request, userId)
    const result = await checkRateLimit(identifier, rateLimitType)

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${result.limit} per window. Try again after ${new Date(result.reset).toLocaleTimeString()}.`,
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Add rate limit headers to successful responses
    const response = await handler(request)
    
    // Add rate limit headers
    Object.entries(result.headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

// Export Redis instance for other uses
export { redis }