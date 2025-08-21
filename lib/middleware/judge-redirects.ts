import { NextRequest, NextResponse } from 'next/server'
import { 
  createCanonicalSlug, 
  generateSlug, 
  isValidSlug, 
  generateSlugVariations,
  isValidSlugVariation,
  getSlugRedirectTarget 
} from '@/lib/utils/slug'

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
  const { pathname, search } = request.nextUrl
  
  // Handle alternative URL patterns
  for (const { pattern, redirect } of ALTERNATIVE_PATTERNS) {
    const match = pathname.match(pattern)
    if (match) {
      const judgeName = match[1]
      const canonicalSlug = createCanonicalSlug(judgeName)
      const redirectUrl = redirect.replace('$1', canonicalSlug)
      console.log(`SEO Redirect: ${pathname} -> ${redirectUrl}`)
      return NextResponse.redirect(new URL(`${redirectUrl}${search}`, request.url), 301)
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
        console.log(`SEO Redirect: ${pathname} -> /judges/${canonicalSlug}`)
        return NextResponse.redirect(
          new URL(`/judges/${canonicalSlug}${search}`, request.url), 
          301
        )
      }
    }
  }

  // Handle judge profile URL standardization
  const judgePageMatch = pathname.match(/^\/judges\/(.+)$/)
  if (judgePageMatch) {
    const currentSlug = judgePageMatch[1]
    
    // Skip API routes and invalid slugs
    if (currentSlug.startsWith('api/') || !isValidSlug(currentSlug)) {
      return null
    }
    
    // Enhanced redirect handling using slug variations
    const nameFromSlug = currentSlug.replace(/-/g, ' ')
    
    // Check common title variations that should be normalized
    const titleVariations = [
      { pattern: /^judge-(.+)/, replacement: '$1' },
      { pattern: /^justice-(.+)/, replacement: '$1' },
      { pattern: /^honorable-(.+)/, replacement: '$1' },
      { pattern: /^the-honorable-(.+)/, replacement: '$1' },
      { pattern: /^hon-(.+)/, replacement: '$1' },
      { pattern: /^(.+)-judge$/, replacement: '$1' },
      { pattern: /^(.+)-justice$/, replacement: '$1' }
    ]
    
    for (const { pattern, replacement } of titleVariations) {
      if (pattern.test(currentSlug)) {
        const normalizedSlug = currentSlug.replace(pattern, replacement)
        const canonicalSlug = createCanonicalSlug(normalizedSlug.replace(/-/g, ' '))
        
        if (canonicalSlug !== currentSlug && canonicalSlug.length > 0) {
          console.log(`SEO Title Normalization: ${pathname} -> /judges/${canonicalSlug}`)
          return NextResponse.redirect(
            new URL(`/judges/${canonicalSlug}${search}`, request.url),
            301
          )
        }
      }
    }
    
    // Check for common spelling/formatting issues
    const canonical = createCanonicalSlug(nameFromSlug)
    if (canonical !== currentSlug && 
        canonical.length > 2 && 
        !currentSlug.includes('unknown')) {
      
      // Only redirect if the difference is meaningful (not just minor variations)
      const currentWords = currentSlug.split('-').filter(w => w.length > 0)
      const canonicalWords = canonical.split('-').filter(w => w.length > 0)
      
      // Allow redirect if word count is similar or if clear normalization is needed
      if (Math.abs(currentWords.length - canonicalWords.length) <= 1 || 
          currentSlug.includes('--') || 
          currentSlug.startsWith('-') || 
          currentSlug.endsWith('-')) {
        
        console.log(`SEO Canonicalization: ${pathname} -> /judges/${canonical}`)
        return NextResponse.redirect(
          new URL(`/judges/${canonical}${search}`, request.url),
          301
        )
      }
    }
  }
  
  // Handle query parameter redirects for judge searches
  const searchParams = request.nextUrl.searchParams
  const judgeQuery = searchParams.get('judge') || 
                    searchParams.get('name') || 
                    searchParams.get('q')
  
  if (judgeQuery && (pathname === '/search' || pathname === '/judges')) {
    // Redirect to direct judge search with canonical slug
    const canonicalSlug = createCanonicalSlug(judgeQuery)
    console.log(`SEO Search Redirect: ${pathname}?${searchParams} -> /judges/${canonicalSlug}`)
    return NextResponse.redirect(
      new URL(`/judges/${canonicalSlug}`, request.url),
      302
    )
  }
  
  // Handle common Google search patterns that might land on our site
  if (pathname === '/' && searchParams.has('q')) {
    const query = searchParams.get('q') || ''
    const lowerQuery = query.toLowerCase()
    
    // If the query looks like a judge search, redirect to judge page
    if (lowerQuery.includes('judge') || 
        lowerQuery.includes('justice') || 
        lowerQuery.includes('honorable')) {
      
      const cleanQuery = query.replace(/\b(judge|justice|the honorable|honorable)\b/gi, '').trim()
      if (cleanQuery.length > 2) {
        const canonicalSlug = createCanonicalSlug(cleanQuery)
        console.log(`SEO Search Term Redirect: /?q=${query} -> /judges/${canonicalSlug}`)
        return NextResponse.redirect(
          new URL(`/judges/${canonicalSlug}`, request.url),
          302
        )
      }
    }
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