import { retryWithBackoff } from '@/lib/utils/helpers'

interface FetchOptions extends RequestInit {
  cacheControl?: string
}

/**
 * Server-side fetch with retries and standard cache headers
 */
export async function ssrFetch(input: string | URL | Request, init: FetchOptions = {}): Promise<Response> {
  const { cacheControl = 's-maxage=60, stale-while-revalidate=300', ...rest } = init

  const doFetch = async () => {
    const res = await fetch(input, {
      ...rest,
      headers: {
        ...(rest.headers || {}),
      },
      // Ensure SSR-friendly caching
      next: { revalidate: 60 },
    })
    if (!res.ok && res.status >= 500) {
      throw new Error(`Upstream error ${res.status}`)
    }
    return res
  }

  const res = await retryWithBackoff(doFetch, 2, 500)

  // Wrap response to inject cache-control when possible
  const clone = new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  })
  try {
    clone.headers.set('Cache-Control', cacheControl)
  } catch {}
  return clone
}



