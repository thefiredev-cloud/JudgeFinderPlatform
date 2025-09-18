import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'

export type RateLimitConfig = {
  tokens: number
  window: string // e.g. '10 s', '1 m'
  prefix?: string
}

let redis: Redis | null = null
function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

export function buildRateLimiter(config: RateLimitConfig) {
  const client = getRedis()
  if (!client) {
    return {
      limit: async (_key: string) => ({ success: true, remaining: 9999, reset: Date.now() + 1000 })
    }
  }
  const ratelimit = new Ratelimit({ redis: client, limiter: Ratelimit.slidingWindow(config.tokens, config.window), prefix: config.prefix || 'rl' })
  return {
    limit: (key: string) => ratelimit.limit(key)
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

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let ratelimit: Ratelimit | null = null

function getLimiter() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  if (ratelimit) return ratelimit
  const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  ratelimit = new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(60, '1 m') }) // 60 req/min per key
  return ratelimit
}

export async function enforceRateLimit(key: string) {
  const limiter = getLimiter()
  if (!limiter) return { allowed: true, remaining: undefined, reset: undefined }
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


