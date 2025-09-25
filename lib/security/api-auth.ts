import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/auth/is-admin'

type AllowedKeyName = 'SYNC_API_KEY' | 'CRON_SECRET'

function getEnvKey(name: AllowedKeyName): string | undefined {
  const value = process.env[name]
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

export function extractApiKey(req: NextRequest): string | null {
  const headerKey = req.headers.get('x-api-key')?.trim()
  if (headerKey) return headerKey

  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('key')?.trim()
    if (q) return q
  } catch (parseError) {
    // ignore URL parse issues
  }
  return null
}

export function isValidApiKey(key: string, allow: AllowedKeyName[] = ['SYNC_API_KEY', 'CRON_SECRET']): boolean {
  const allowedValues = allow
    .map(getEnvKey)
    .filter((v): v is string => Boolean(v))
  return allowedValues.includes(key.trim())
}

export function requireApiKey(
  req: NextRequest,
  options: { allow?: AllowedKeyName[]; respond?: boolean } = {}
): { ok: true } | NextResponse {
  const { allow = ['SYNC_API_KEY', 'CRON_SECRET'], respond = true } = options
  const provided = extractApiKey(req)
  if (!provided || !isValidApiKey(provided, allow)) {
    if (!respond) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return { ok: true }
}

export async function requireAdminApiAccess(
  req: NextRequest,
  allow: AllowedKeyName[] = ['SYNC_API_KEY', 'CRON_SECRET']
): Promise<void> {
  const providedKey = extractApiKey(req)
  if (providedKey && isValidApiKey(providedKey, allow)) {
    return
  }

  const { userId } = await auth()
  if (!userId || !(await isAdmin())) {
    throw new Error('Forbidden')
  }
}

export function requireApiKeyIfEnabled(headers: Headers, url?: string): { ok: boolean; reason?: string } {
  const requireKey = String(process.env.REQUIRE_API_KEY_FOR_V1 || '').toLowerCase() === 'true'
  if (!requireKey) return { ok: true }

  const headerKey = headers.get('x-api-key')?.trim()
  const queryKey = extractKeyFromUrl(url)
  const provided = headerKey || queryKey
  if (!provided) return { ok: false, reason: 'missing_api_key' }

  const allowedKeys = buildAllowedKeySet()
  if (allowedKeys.size === 0) {
    return { ok: false, reason: 'no_keys_configured' }
  }

  const isAllowed = allowedKeys.has(provided)
  return { ok: isAllowed, reason: isAllowed ? undefined : 'invalid_api_key' }
}

function extractKeyFromUrl(url?: string): string | undefined {
  if (!url) return undefined
  try {
    const parsedUrl = new URL(url)
    const key = parsedUrl.searchParams.get('key')
    return key ? key.trim() : undefined
  } catch {
    return undefined
  }
}

function buildAllowedKeySet(): Set<string> {
  const single = process.env.PUBLIC_API_KEY?.trim()
  const csvKeys = (process.env.PUBLIC_API_KEYS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  return new Set([...(single ? [single] : []), ...csvKeys])
}


