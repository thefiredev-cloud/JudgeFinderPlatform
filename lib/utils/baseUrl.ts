export function getBaseUrl(): string {
  // Prefer explicit public site URL
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.URL || // Netlify primary URL
    process.env.DEPLOY_PRIME_URL || // Netlify deploy preview
    'https://judgefinder.io'

  // Normalize: trim whitespace and trailing slash
  url = url.trim().replace(/\/$/, '')

  // Enforce https scheme if missing or using http
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    if (parsed.protocol !== 'https:') {
      parsed.protocol = 'https:'
    }
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    // Fallback to default
    return 'https://judgefinder.io'
  }
}
