import { NextRequest, NextResponse } from 'next/server'
import { createCanonicalSlug, generateSlug, isValidSlug } from '@/lib/utils/slug'

// Common judge name patterns that should redirect to canonical URLs
const JUDGE_NAME_PATTERNS = [
  /^\/judge-(.+)$/,
  /^\/judges\/judge-(.+)$/,
  /^\/(.+)-judge$/,
  /^\/honorable-(.+)$/,
  /^\/justice-(.+)$/,
  /^\/judges\/honorable-(.+)$/,
  /^\/judges\/justice-(.+)$/,
]

// Alternative URL patterns that should redirect
const ALTERNATIVE_PATTERNS = [
  { pattern: /^\/justice\/(.+)$/, redirect: '/judges/$1' },
  { pattern: /^\/court\/judge\/(.+)$/, redirect: '/judges/$1' },
  { pattern: /^\/judicial\/(.+)$/, redirect: '/judges/$1' },
  { pattern: /^\/profile\/judge\/(.+)$/, redirect: '/judges/$1' },
  { pattern: /^\/judge\/(.+)$/, redirect: '/judges/$1' },
]

export function handleJudgeRedirects(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  
  // Handle alternative URL patterns
  for (const { pattern, redirect } of ALTERNATIVE_PATTERNS) {
    const match = pathname.match(pattern)
    if (match) {
      const judgeName = match[1]
      const canonicalSlug = createCanonicalSlug(judgeName)
      const redirectUrl = redirect.replace('$1', canonicalSlug)
      return NextResponse.redirect(new URL(redirectUrl, request.url), 301)
    }
  }
  
  // Handle judge name patterns that should redirect to canonical format
  for (const pattern of JUDGE_NAME_PATTERNS) {
    const match = pathname.match(pattern)
    if (match) {
      const judgeName = match[1]
      const canonicalSlug = createCanonicalSlug(judgeName)
      
      // Only redirect if the slug format is different
      if (judgeName !== canonicalSlug) {
        return NextResponse.redirect(
          new URL(`/judges/${canonicalSlug}`, request.url), 
          301
        )
      }
    }
  }

  // Handle canonical URL validation for existing judge pages
  const judgePageMatch = pathname.match(/^\/judges\/(.+)$/)
  if (judgePageMatch) {
    const currentSlug = judgePageMatch[1]
    
    // Skip if already a valid canonical slug
    if (isValidSlug(currentSlug)) {
      // Check if this needs to be converted to canonical format
      // This is a simplified check - in production you'd want to validate against database
      const potentialCanonical = createCanonicalSlug(currentSlug.replace(/-/g, ' '))
      
      // Only redirect if significantly different (avoid redirect loops)
      if (potentialCanonical !== currentSlug && 
          !currentSlug.includes('unknown') && 
          potentialCanonical.length > 3) {
        
        // Additional validation: only redirect if it looks like a name normalization
        const slugWords = currentSlug.split('-').length
        const canonicalWords = potentialCanonical.split('-').length
        
        // Allow redirect if word count difference is reasonable (avoid false positives)
        if (Math.abs(slugWords - canonicalWords) <= 2) {
          return NextResponse.redirect(
            new URL(`/judges/${potentialCanonical}`, request.url),
            301
          )
        }
      }
    }
  }
  
  // Handle query parameter redirects for judge searches
  const searchParams = request.nextUrl.searchParams
  const judgeQuery = searchParams.get('judge') || searchParams.get('name')
  
  if (judgeQuery && pathname === '/search') {
    // Redirect to direct judge search with canonical slug
    const canonicalSlug = createCanonicalSlug(judgeQuery)
    return NextResponse.redirect(
      new URL(`/judges/${canonicalSlug}`, request.url),
      302
    )
  }
  
  return null
}

// Generate canonical URL for a judge
export function getCanonicalJudgeUrl(judgeName: string, baseUrl: string = 'https://judgefinder.io'): string {
  const canonicalSlug = createCanonicalSlug(judgeName)
  return `${baseUrl}/judges/${canonicalSlug}`
}

// SEO-optimized canonical URL with judge title variations  
export function generateJudgeUrlVariations(judgeName: string, baseUrl: string = 'https://judgefinder.io'): string[] {
  const baseName = judgeName.replace(/^(judge|justice|the honorable)\s+/i, '')
  const canonicalSlug = createCanonicalSlug(baseName)
  
  const variations = [
    `${baseUrl}/judges/${canonicalSlug}`,
    `${baseUrl}/judges/judge-${canonicalSlug}`,
    `${baseUrl}/judges/justice-${canonicalSlug}`,
    `${baseUrl}/judges/honorable-${canonicalSlug}`,
  ]

  // Add variations without middle names/initials for common search patterns
  const nameParts = baseName.split(' ').filter(part => part.length > 1)
  if (nameParts.length > 2) {
    const firstLast = `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
    const firstLastSlug = createCanonicalSlug(firstLast)
    variations.push(`${baseUrl}/judges/${firstLastSlug}`)
  }

  // Remove duplicates and return
  return [...new Set(variations)]
}

// Check if current URL is canonical for the given judge name
export function isCanonicalJudgeUrl(currentSlug: string, judgeName: string): boolean {
  const canonicalSlug = createCanonicalSlug(judgeName)
  return currentSlug === canonicalSlug
}

// Get redirect URL if current slug is not canonical
export function getCanonicalRedirectUrl(currentSlug: string, judgeName: string, baseUrl: string = 'https://judgefinder.io'): string | null {
  if (isCanonicalJudgeUrl(currentSlug, judgeName)) {
    return null
  }
  
  return getCanonicalJudgeUrl(judgeName, baseUrl)
}