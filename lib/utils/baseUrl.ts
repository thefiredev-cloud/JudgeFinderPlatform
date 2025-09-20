export function getBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'https://judgefinder.io'

  return url.replace(/\/$/, '')
}
