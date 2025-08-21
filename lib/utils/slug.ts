/**
 * Shared slug generation utilities for consistent URL handling
 * Addresses the 404 error issue by providing standardized slug management
 * 
 * Key features:
 * - Consistent slug generation and parsing
 * - Comprehensive name variation handling
 * - Input validation and sanitization
 * - TypeScript type safety
 */

import type { SlugGenerationOptions } from '@/types'

/**
 * Generate a URL-friendly slug from a judge name
 * Consistent with the profile page expectations
 * 
 * @param name - The judge's full name
 * @param options - Optional configuration for slug generation
 * @returns A URL-friendly slug
 */
export function generateSlug(
  name: string, 
  options: SlugGenerationOptions = {}
): string {
  if (!name || typeof name !== 'string') {
    console.warn('Invalid name provided to generateSlug:', name)
    return 'unknown-judge'
  }

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove all special characters but keep spaces
    .replace(/\s+/g, '-')        // Convert spaces to hyphens
    .replace(/(^-|-$)/g, '')     // Remove leading/trailing hyphens
    .replace(/-+/g, '-')         // Replace multiple hyphens with single hyphen

  // Fallback to ID if slug is empty or invalid
  if (!slug || slug === '' || slug === '-') {
    if (options.fallbackToId) {
      return `judge-${Date.now()}`
    }
    console.warn('Generated empty slug for name:', name)
    return 'unknown-judge'
  }

  return slug
}

/**
 * Convert a slug back to a readable name format
 * Handles initials, numbers, and proper capitalization
 */
export function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(word => {
      // Handle single letters (initials) by adding periods
      if (word.length === 1 && /^[a-z]$/i.test(word)) {
        return word.toUpperCase() + '.'
      }
      // Handle numbers and roman numerals as-is  
      if (/^\d+$/.test(word) || /^[ivxlcdm]+$/i.test(word)) {
        return word.toUpperCase()
      }
      // Regular capitalization for other words
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Validate if a slug matches expected format
 * 
 * @param slug - The slug to validate
 * @returns True if the slug is valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false
  }

  // Check basic format: lowercase letters, numbers, and hyphens only
  // Must start and end with alphanumeric, no consecutive hyphens
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && 
         slug.length >= 2 && 
         slug.length <= 100 && // Reasonable length limit
         !slug.includes('--') // No consecutive hyphens
}

/**
 * Generate multiple name variations for database lookup
 * Provides fallback search strategies
 */
export function generateNameVariations(name: string): string[] {
  const variations = [name]
  const nameParts = name.split(' ').filter(part => part.length > 0)
  
  // Normalize spacing - the database may have extra spaces
  const normalizedSpacing = name.replace(/\s+/g, ' ').trim()
  if (normalizedSpacing !== name) {
    variations.push(normalizedSpacing)
  }
  
  // Try with various spacing patterns between name parts
  const doubleSpaced = nameParts.join('  ') // Double spaces like "Allen  L. Norris"
  variations.push(doubleSpaced)
  
  const singleSpaced = nameParts.join(' ') // Single spaces
  variations.push(singleSpaced)
  
  // Try strategic double spacing patterns - common database inconsistencies
  if (nameParts.length >= 3) {
    // Double space between first and middle: "Allen  L. Norris"
    const doubleSpaceFirstMiddle = `${nameParts[0]}  ${nameParts.slice(1).join(' ')}`
    variations.push(doubleSpaceFirstMiddle)
    
    // Double space between middle and last: "Allen L.  Norris"
    const middleParts = nameParts.slice(0, -1).join(' ')
    const doubleSpaceMiddleLast = `${middleParts}  ${nameParts[nameParts.length - 1]}`
    variations.push(doubleSpaceMiddleLast)
  }
  
  // Without periods in initials
  const withoutPeriods = name.replace(/\./g, '')
  if (withoutPeriods !== name) {
    variations.push(withoutPeriods)
    variations.push(withoutPeriods.replace(/\s+/g, ' ')) // Also normalize spacing
  }
  
  // With periods added to single letters
  const withPeriods = name.replace(/\b([A-Z])\b/g, '$1.')
  if (withPeriods !== name) {
    variations.push(withPeriods)
  }
  
  // Simple first/last name only (skip middle names/initials)
  if (nameParts.length > 2) {
    const simpleName = `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
    variations.push(simpleName)
    
    // Also try without periods
    const simpleWithoutPeriods = simpleName.replace(/\./g, '')
    if (simpleWithoutPeriods !== simpleName) {
      variations.push(simpleWithoutPeriods)
    }
  }
  
  // Reversed format (Last, First)
  if (nameParts.length >= 2) {
    const reversedName = `${nameParts[nameParts.length - 1]}, ${nameParts[0]}`
    variations.push(reversedName)
  }
  
  // Try with different spacing around initials
  const spacedInitials = name.replace(/([A-Z]\.)/g, ' $1 ').replace(/\s+/g, ' ').trim()
  if (spacedInitials !== name) {
    variations.push(spacedInitials)
  }
  
  // Remove duplicates while preserving order and filter out empty/invalid names
  return [...new Set(variations)]
    .filter(variation => variation && variation.trim().length > 0)
    .slice(0, 20) // Limit variations to prevent excessive queries
}

/**
 * Normalize a judge name for consistent comparison
 * Handles common formatting inconsistencies in the database
 * 
 * @param name - The name to normalize
 * @returns A normalized version of the name
 */
export function normalizeName(name: string): string {
  if (!name || typeof name !== 'string') {
    return ''
  }

  return name
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\b(\w)\./g, '$1.') // Ensure periods after initials
    .replace(/\.{2,}/g, '.') // Remove multiple periods
}

/**
 * Extract components from a judge name for better matching
 * 
 * @param name - The judge's full name
 * @returns An object with name components
 */
export function parseJudgeName(name: string): {
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  initials: string[]
} {
  if (!name || typeof name !== 'string') {
    return {
      firstName: '',
      lastName: '',
      initials: []
    }
  }

  const normalized = normalizeName(name)
  const parts = normalized.split(' ').filter(part => part.length > 0)
  
  if (parts.length === 0) {
    return {
      firstName: '',
      lastName: '',
      initials: []
    }
  }

  const suffixes = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V']
  const lastPart = parts[parts.length - 1]
  const hasSuffix = suffixes.includes(lastPart)
  
  const namePartsWithoutSuffix = hasSuffix ? parts.slice(0, -1) : parts
  const suffix = hasSuffix ? lastPart : undefined

  const firstName = namePartsWithoutSuffix[0] || ''
  const lastName = namePartsWithoutSuffix.length > 1 
    ? namePartsWithoutSuffix[namePartsWithoutSuffix.length - 1]
    : ''
  const middleName = namePartsWithoutSuffix.length > 2
    ? namePartsWithoutSuffix.slice(1, -1).join(' ')
    : namePartsWithoutSuffix.length === 2 ? undefined : ''

  const initials = namePartsWithoutSuffix
    .filter(part => /^[A-Z]\.?$/.test(part))
    .map(part => part.replace('.', ''))

  return {
    firstName,
    middleName,
    lastName,
    suffix,
    initials
  }
}

/**
 * Create a canonical slug that should be stored in the database
 * This is the "source of truth" slug generation method
 * 
 * @param name - The judge's full name
 * @returns A canonical slug for database storage
 */
export function createCanonicalSlug(name: string): string {
  const parsed = parseJudgeName(name)
  
  if (!parsed.firstName || !parsed.lastName) {
    return generateSlug(name)
  }

  // Create a canonical format: firstname-middle-lastname
  const parts = [parsed.firstName]
  
  if (parsed.middleName) {
    parts.push(parsed.middleName)
  }
  
  parts.push(parsed.lastName)
  
  if (parsed.suffix) {
    parts.push(parsed.suffix.replace('.', ''))
  }

  return generateSlug(parts.join(' '))
}

/**
 * Generate all possible slug variations for a judge name
 * This is crucial for SEO - we want to catch all possible searches
 * 
 * @param name - The judge's full name
 * @returns Array of all possible slug variations
 */
export function generateSlugVariations(name: string): string[] {
  const canonical = createCanonicalSlug(name)
  const variations = new Set<string>([canonical])
  const parsed = parseJudgeName(name)
  
  // Base name without titles
  const baseName = name.replace(/^(judge|justice|the honorable|hon\.?)\s+/gi, '').trim()
  variations.add(generateSlug(baseName))
  
  // With common title prefixes (how people search)
  variations.add(generateSlug(`judge ${baseName}`))
  variations.add(generateSlug(`justice ${baseName}`))
  variations.add(generateSlug(`honorable ${baseName}`))
  variations.add(generateSlug(`the honorable ${baseName}`))
  variations.add(generateSlug(`hon ${baseName}`))
  
  // First and last name only (common search pattern)
  if (parsed.firstName && parsed.lastName) {
    const firstLast = `${parsed.firstName} ${parsed.lastName}`
    variations.add(generateSlug(firstLast))
    variations.add(generateSlug(`judge ${firstLast}`))
    variations.add(generateSlug(`justice ${firstLast}`))
  }
  
  // Name with initials in different formats
  if (parsed.initials.length > 0) {
    const nameWithInitials = `${parsed.firstName} ${parsed.initials.join(' ')} ${parsed.lastName}`
    variations.add(generateSlug(nameWithInitials))
    
    const nameWithPeriodsInitials = `${parsed.firstName} ${parsed.initials.map(i => i + '.').join(' ')} ${parsed.lastName}`
    variations.add(generateSlug(nameWithPeriodsInitials))
  }
  
  // Without middle names/initials (how people often search)
  if (parsed.firstName && parsed.lastName) {
    variations.add(generateSlug(`${parsed.firstName} ${parsed.lastName}`))
  }
  
  // Common variations with suffix
  if (parsed.suffix) {
    const withoutSuffix = `${parsed.firstName} ${parsed.lastName}`
    variations.add(generateSlug(withoutSuffix))
  }
  
  // Remove invalid variations and return as array
  return Array.from(variations)
    .filter(slug => isValidSlug(slug))
    .filter(slug => slug.length > 0)
    .sort((a, b) => a === canonical ? -1 : b === canonical ? 1 : a.localeCompare(b))
}

/**
 * Check if a slug is a valid variation of a judge's canonical slug
 * Used for redirect logic
 * 
 * @param slug - The slug to check
 * @param judgeName - The judge's name
 * @returns True if the slug is a valid variation
 */
export function isValidSlugVariation(slug: string, judgeName: string): boolean {
  if (!isValidSlug(slug) || !judgeName) return false
  
  const variations = generateSlugVariations(judgeName)
  return variations.includes(slug)
}

/**
 * Get the redirect target for a non-canonical slug
 * 
 * @param slug - The current slug
 * @param judgeName - The judge's name
 * @returns The canonical slug to redirect to, or null if no redirect needed
 */
export function getSlugRedirectTarget(slug: string, judgeName: string): string | null {
  const canonical = createCanonicalSlug(judgeName)
  
  if (slug === canonical) return null // No redirect needed
  
  if (isValidSlugVariation(slug, judgeName)) {
    return canonical // Redirect to canonical
  }
  
  return null // Not a valid variation
}

/**
 * Generate SEO-friendly URL variations for sitemap generation
 * Includes all the ways people might find this judge
 * 
 * @param judgeName - The judge's name
 * @param baseUrl - The base URL (e.g., 'https://judgefinder.io')
 * @returns Array of URL variations for this judge
 */
export function generateJudgeUrlVariations(judgeName: string, baseUrl: string = ''): string[] {
  const slugVariations = generateSlugVariations(judgeName)
  const canonical = createCanonicalSlug(judgeName)
  
  // Primary URL (canonical)
  const urls = [`${baseUrl}/judges/${canonical}`]
  
  // Add top variations that people are likely to search
  const topVariations = slugVariations
    .filter(slug => slug !== canonical)
    .slice(0, 3) // Limit to prevent sitemap bloat
  
  topVariations.forEach(slug => {
    urls.push(`${baseUrl}/judges/${slug}`)
  })
  
  return urls
}

/**
 * Generate a URL-friendly slug from a court name
 * Removes problematic characters like commas that cause URL encoding issues
 * 
 * @param name - The court's full name
 * @returns A URL-friendly slug without special characters
 */
export function generateCourtSlug(name: string): string {
  if (!name || typeof name !== 'string') {
    console.warn('Invalid court name provided to generateCourtSlug:', name)
    return 'unknown-court'
  }

  const slug = name
    .trim()
    .toLowerCase()
    // Remove all special characters including commas to prevent URL encoding issues
    .replace(/[^a-z0-9\s]/g, '')    // Only keep letters, numbers, and spaces
    .replace(/\s+/g, '-')           // Convert spaces to hyphens
    .replace(/(^-|-$)/g, '')        // Remove leading/trailing hyphens
    .replace(/-+/g, '-')            // Replace multiple hyphens with single hyphen

  if (!slug || slug === '' || slug === '-') {
    console.warn('Generated empty slug for court name:', name)
    return 'unknown-court'
  }

  return slug
}

/**
 * Convert a court slug back to a readable name format
 * Handles court-specific formatting like commas and proper capitalization
 */
export function courtSlugToName(slug: string): string {
  if (!slug || typeof slug !== 'string') {
    return ''
  }

  return slug
    .split('-')
    .map(word => {
      // Handle single letters and abbreviations
      if (word.length <= 2 && /^[a-z]+$/i.test(word)) {
        return word.toUpperCase()
      }
      // Regular capitalization for other words
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
    .replace(/,\s*/g, ', ') // Fix comma spacing in court names
}

/**
 * Check if a court slug is valid
 */
export function isValidCourtSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false
  }

  // Only allow letters, numbers, and hyphens (no commas or special characters)
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && 
         slug.length >= 2 && 
         slug.length <= 150 && // Longer limit for court names
         !slug.includes('--') // No consecutive hyphens
}

/**
 * Generate multiple court name variations for database lookup
 */
export function generateCourtNameVariations(name: string): string[] {
  const variations = [name]
  
  // Normalize spacing
  const normalizedSpacing = name.replace(/\s+/g, ' ').trim()
  if (normalizedSpacing !== name) {
    variations.push(normalizedSpacing)
  }
  
  // Try with different comma spacing
  const withCommaSpace = name.replace(/,([^\s])/g, ', $1')
  if (withCommaSpace !== name) {
    variations.push(withCommaSpace)
  }
  
  const withoutCommaSpace = name.replace(/,\s+/g, ',')
  if (withoutCommaSpace !== name) {
    variations.push(withoutCommaSpace)
  }
  
  // Try with "Superior Court of California" variations
  if (name.includes('Superior Court of California')) {
    const withCounty = name.replace('Superior Court of California', 'Superior Court of California, County of')
    variations.push(withCounty)
    
    const withoutCounty = name.replace(', County of', '')
    variations.push(withoutCounty)
  }
  
  // Remove duplicates and filter out empty names
  return [...new Set(variations)]
    .filter(variation => variation && variation.trim().length > 0)
    .slice(0, 10) // Limit variations
}

/**
 * Create canonical court slug for database storage
 * This ensures consistent slug generation across the platform
 */
export function createCanonicalCourtSlug(name: string): string {
  return generateCourtSlug(name)
}

/**
 * Generate court slug variations for lookup
 * Helps find courts when URL might use different formats
 */
export function generateCourtSlugVariations(name: string): string[] {
  const canonical = createCanonicalCourtSlug(name)
  const variations = new Set<string>([canonical])

  // Add variations with different word combinations
  const words = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
  
  // Try with key court words only
  const courtKeywords = ['superior', 'court', 'california', 'county', 'municipal', 'district']
  const filteredWords = words.filter(word => 
    word.length > 2 && (courtKeywords.includes(word) || !courtKeywords.some(k => k !== word))
  )
  
  if (filteredWords.length !== words.length) {
    variations.add(filteredWords.join('-'))
  }

  // Add short version (remove common words)
  const shortWords = words.filter(word => 
    !['of', 'the', 'in', 'and', 'for'].includes(word) && word.length > 2
  )
  if (shortWords.length !== words.length && shortWords.length > 0) {
    variations.add(shortWords.join('-'))
  }

  return Array.from(variations).filter(slug => isValidCourtSlug(slug))
}

/**
 * Check if a given string could be a court identifier (ID or slug)
 * This helps determine lookup strategy
 */
export function isCourtIdentifier(identifier: string): { isSlug: boolean; isId: boolean } {
  if (!identifier || typeof identifier !== 'string') {
    return { isSlug: false, isId: false }
  }

  const isSlug = isValidCourtSlug(identifier)
  const isId = identifier.includes(',') || identifier.includes('.') || /[A-Z]/.test(identifier)

  return { isSlug, isId }
}

/**
 * Normalize court identifier for database lookup
 * Handles both slug and ID formats
 */
export function normalizeCourtIdentifier(identifier: string): string {
  if (!identifier) return ''
  
  // Decode URL encoding
  const decoded = decodeURIComponent(identifier)
  
  // If it looks like a slug, return as-is
  if (isValidCourtSlug(decoded)) {
    return decoded
  }
  
  // If it contains special characters, treat as ID and generate slug
  return generateCourtSlug(decoded)
}

/**
 * Alias for generateSlug to maintain backward compatibility
 * 
 * @param name - The judge's full name
 * @returns A URL-friendly slug
 */
export function nameToSlug(name: string): string {
  return generateSlug(name)
}