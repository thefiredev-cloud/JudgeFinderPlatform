import { Redis } from '@upstash/redis'

let redis: Redis | null = null

export function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

export async function redisGetJSON<T>(key: string): Promise<T | null> {
  const client = getRedis()
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
  const client = getRedis()
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


