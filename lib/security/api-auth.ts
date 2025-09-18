import { NextRequest, NextResponse } from 'next/server'

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
  } catch (_) {
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

export function requireApiKeyIfEnabled(headers: Headers, url?: string) {
  const requireKey = String(process.env.REQUIRE_API_KEY_FOR_V1 || '').toLowerCase() === 'true'
  if (!requireKey) return { ok: true }

  const headerKey = headers.get('x-api-key')?.trim()
  const keyFromQuery = (() => {
    if (!url) return undefined
    try {
      const u = new URL(url)
      const k = u.searchParams.get('key')
      return k ? k.trim() : undefined
    } catch {
      return undefined
    }
  })()

  const provided = headerKey || keyFromQuery
  if (!provided) return { ok: false, reason: 'missing_api_key' }

  const single = process.env.PUBLIC_API_KEY?.trim()
  const csv = (process.env.PUBLIC_API_KEYS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const allowed = new Set([...(single ? [single] : []), ...csv])
  if (allowed.size === 0) return { ok: false, reason: 'no_keys_configured' }

  return { ok: allowed.has(provided), reason: allowed.has(provided) ? undefined : 'invalid_api_key' }
}


