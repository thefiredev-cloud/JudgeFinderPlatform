import { Redis } from '@upstash/redis'

let redis: Redis | null = null

function ensureRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

export function getRedis(): Redis | null {
  return ensureRedis()
}

export async function redisGetJSON<T>(key: string): Promise<T | null> {
  const client = ensureRedis()
  if (!client) return null
  try {
    const raw = await client.get<string>(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function redisSetJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  const client = ensureRedis()
  if (!client) return
  try {
    const payload = JSON.stringify(value)
    if (ttlSeconds && ttlSeconds > 0) {
      await client.set(key, payload, { ex: ttlSeconds })
    } else {
      await client.set(key, payload)
    }
  } catch {
    // ignore cache errors
  }
}

export function buildCacheKey(namespace: string, params: Record<string, unknown>): string {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${typeof value === 'object' ? JSON.stringify(value) : value}`)
    .join('|')
  return `${namespace}:${serialized}`
}

export async function withRedisCache<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
  const existing = await redisGetJSON<T>(key)
  if (existing) {
    return { data: existing, cached: true }
  }

  const data = await compute()
  await redisSetJSON(key, data, ttlSeconds)
  return { data, cached: false }
}


