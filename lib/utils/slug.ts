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
 * Alias for generateSlug to maintain backward compatibility
 * 
 * @param name - The judge's full name
 * @returns A URL-friendly slug
 */
export function nameToSlug(name: string): string {
  return generateSlug(name)
}