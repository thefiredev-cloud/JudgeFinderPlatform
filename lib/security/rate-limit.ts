import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'

export type RateLimitConfig = {
  tokens: number
  window: string // e.g. '10 s', '1 m'
  prefix?: string
}

let sharedRedis: Redis | null = null
let defaultLimiter: Ratelimit | null = null

function getRedis(): Redis | null {
  if (sharedRedis) {
    return sharedRedis
  }

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return null
  }

  sharedRedis = new Redis({ url, token })
  return sharedRedis
}

export function buildRateLimiter(config: RateLimitConfig) {
  const client = getRedis()

  if (!client) {
    return {
      limit: async (_key: string) => ({ success: true, remaining: 9999, reset: Date.now() + 1000 })
    }
  }

  const duration = config.window as Parameters<(typeof Ratelimit)['slidingWindow']>[1]
  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(config.tokens, duration),
    prefix: config.prefix || 'rl'
  })

  return {
    limit: (key: string) => limiter.limit(key)
  }
}

export function getClientIp(req: NextRequest): string {
  const h = req.headers
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip')?.trim() ||
    'unknown'
  )
}

function getDefaultLimiter(): Ratelimit | null {
  if (defaultLimiter) {
    return defaultLimiter
  }

  const client = getRedis()
  if (!client) {
    return null
  }

  defaultLimiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.fixedWindow(60, '1 m'),
    prefix: 'api:default'
  })

  return defaultLimiter
}

export async function enforceRateLimit(key: string) {
  const limiter = getDefaultLimiter()

  if (!limiter) {
    return { allowed: true, remaining: undefined, reset: undefined }
  }

  const res = await limiter.limit(key)
  return { allowed: res.success, remaining: res.remaining, reset: res.reset }
}

export function getClientKey(headers: Headers) {
  return (
    headers.get('x-api-key') ||
    headers.get('x-forwarded-for') ||
    headers.get('cf-connecting-ip') ||
    'anonymous'
  )
}
