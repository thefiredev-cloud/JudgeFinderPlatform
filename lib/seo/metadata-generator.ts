/**
 * Advanced SEO metadata generation for maximum search dominance
 * This module creates optimized titles, descriptions, and keywords
 * designed to rank #1 for all judge-related searches
 */

import { parseJudgeName, createCanonicalSlug } from '@/lib/utils/slug'
import type { Judge } from '@/types'

interface SEOMetadata {
  title: string
  description: string
  keywords: string[]
  canonicalUrl: string
  alternateUrls: string[]
  socialTitle: string
  socialDescription: string
}

/**
 * Generate comprehensive SEO metadata for a judge profile
 * Optimized for maximum Google search ranking
 */
export function generateJudgeMetadata(
  judge: Judge, 
  params: { slug: string },
  baseUrl: string = 'https://judgefinder.io'
): SEOMetadata {
  const safeName = judge.name || 'Unknown Judge'
  const safeCourtName = judge.court_name || 'Unknown Court'
  const safeJurisdiction = judge.jurisdiction || 'Unknown Jurisdiction'
  const canonicalSlug = judge.slug || createCanonicalSlug(safeName)
  
  // Parse name components for better targeting
  const parsedName = parseJudgeName(safeName)
  const nameWithoutTitle = safeName.replace(/^(judge|justice|the honorable|hon\.?)\s+/i, '').trim()
  const firstName = parsedName.firstName
  const lastName = parsedName.lastName
  const fullNameNoMiddle = firstName && lastName ? `${firstName} ${lastName}` : nameWithoutTitle
  
  // Court classification for targeted keywords
  const courtType = classifyCourtType(safeCourtName)
  const jurisdictionType = classifyJurisdiction(safeJurisdiction)
  
  // Experience calculation for dynamic titles
  const experienceInfo = calculateExperience(judge.appointed_date || undefined)
  
  // Generate optimized title variations
  const title = generateOptimizedTitle(
    nameWithoutTitle, 
    safeJurisdiction, 
    courtType, 
    experienceInfo
  )
  
  // Generate compelling description
  const description = generateCompellingDescription(
    nameWithoutTitle,
    safeCourtName,
    safeJurisdiction,
    experienceInfo
  )
  
  // Generate comprehensive keywords for search dominance
  const keywords = generateComprehensiveKeywords(
    nameWithoutTitle,
    firstName,
    lastName,
    fullNameNoMiddle,
    safeCourtName,
    safeJurisdiction,
    courtType,
    jurisdictionType
  )
  
  // Generate alternate URLs for sitemap
  const alternateUrls = generateAlternateUrls(nameWithoutTitle, baseUrl)
  
  return {
    title,
    description,
    keywords,
    canonicalUrl: `${baseUrl}/judges/${canonicalSlug}`,
    alternateUrls,
    socialTitle: generateSocialTitle(nameWithoutTitle, safeJurisdiction, courtType),
    socialDescription: generateSocialDescription(nameWithoutTitle, safeCourtName, experienceInfo)
  }
}

/**
 * Classify court type for better SEO targeting
 */
function classifyCourtType(courtName: string): string {
  const name = courtName.toLowerCase()
  
  if (name.includes('superior')) return 'Superior Court'
  if (name.includes('appeal')) return 'Court of Appeal'
  if (name.includes('supreme')) return 'Supreme Court'
  if (name.includes('federal')) return 'Federal Court'
  if (name.includes('district')) return 'District Court'
  if (name.includes('municipal')) return 'Municipal Court'
  if (name.includes('family')) return 'Family Court'
  if (name.includes('criminal')) return 'Criminal Court'
  if (name.includes('civil')) return 'Civil Court'
  if (name.includes('traffic')) return 'Traffic Court'
  if (name.includes('small claims')) return 'Small Claims Court'
  
  return 'Court'
}

/**
 * Classify jurisdiction for targeted SEO
 */
function classifyJurisdiction(jurisdiction: string): string {
  const name = jurisdiction.toLowerCase()
  
  if (name.includes('county')) return 'County'
  if (name.includes('city')) return 'City'
  if (name.includes('state')) return 'State'
  if (name.includes('federal')) return 'Federal'
  
  return 'Jurisdiction'
}

/**
 * Calculate experience information for dynamic content
 */
function calculateExperience(appointedDate?: string): {
  years: number
  isVeteran: boolean
  isExperienced: boolean
  description: string
} {
  if (!appointedDate) {
    return {
      years: 0,
      isVeteran: false,
      isExperienced: false,
      description: ''
    }
  }
  
  try {
    const years = new Date().getFullYear() - new Date(appointedDate).getFullYear()
    return {
      years,
      isVeteran: years >= 15,
      isExperienced: years >= 5,
      description: years > 0 ? `${years}+ years` : ''
    }
  } catch {
    return {
      years: 0,
      isVeteran: false,
      isExperienced: false,
      description: ''
    }
  }
}

/**
 * Generate SEO-optimized title variations for maximum CTR
 */
function generateOptimizedTitle(
  name: string,
  jurisdiction: string,
  courtType: string,
  experience: { years: number; isVeteran: boolean; isExperienced: boolean }
): string {
  // Dynamic title patterns based on experience and relevance
  const titlePatterns = [
    // Veteran judges (15+ years)
    ...(experience.isVeteran ? [
      `${name} | Veteran ${jurisdiction} ${courtType} Judge | 📊 Complete Analytics & Profile`,
      `Judge ${name} | ${experience.years}+ Years Experience | ${jurisdiction} ${courtType} | Official Profile`,
      `The Honorable ${name} | Senior ${jurisdiction} Judge | Judicial Analytics & Background`
    ] : []),
    
    // Experienced judges (5+ years)
    ...(experience.isExperienced ? [
      `Judge ${name} | ${jurisdiction} ${courtType} | ${experience.years}+ Years Experience | Complete Profile`,
      `${name} | Experienced ${jurisdiction} Judge | Official Profile & Analytics`,
      `Judge ${name} | ${jurisdiction} ${courtType} | Judicial Analytics & Background`
    ] : []),
    
    // General patterns
    `Judge ${name} | ${jurisdiction} ${courtType} | Complete Profile & Judicial Analytics`,
    `${name} | ${jurisdiction} ${courtType} Judge | Official Profile & Case Analytics`,
    `Judge ${name} | ${jurisdiction} Superior Court | Judicial Profile & Background`,
    `The Honorable ${name} | ${jurisdiction} Judge | Complete Judicial Analytics`
  ]
  
  // Select the most compelling title
  return titlePatterns[0] || `Judge ${name} | ${jurisdiction} ${courtType} | Complete Profile & Analytics`
}

/**
 * Generate compelling meta descriptions for high CTR
 */
function generateCompellingDescription(
  name: string,
  courtName: string,
  jurisdiction: string,
  experience: { years: number; description: string; isVeteran: boolean }
): string {
  const baseDescription = experience.isVeteran
    ? `Get complete profile for veteran Judge ${name} serving ${courtName} in ${jurisdiction}`
    : `Research Judge ${name} serving ${courtName} in ${jurisdiction}`
  
  const experienceText = experience.description 
    ? ` with ${experience.description} judicial experience` 
    : ''
  
  const callToAction = experience.isVeteran
    ? 'Essential legal intelligence for case strategy, attorney selection & court research.'
    : 'Access judicial analytics, ruling patterns, case outcomes & connect with experienced attorneys.'
  
  return `${baseDescription}${experienceText}. View ruling patterns, case outcomes, professional background & find qualified attorneys with court experience. ${callToAction}`
}

/**
 * Generate social media optimized titles
 */
function generateSocialTitle(name: string, jurisdiction: string, courtType: string): string {
  return `Judge ${name} - ${jurisdiction} ${courtType} | Judicial Analytics & Profile`
}

/**
 * Generate social media descriptions
 */
function generateSocialDescription(
  name: string, 
  courtName: string,
  experience: { description: string }
): string {
  const experienceText = experience.description ? ` with ${experience.description} experience` : ''
  return `Research Judge ${name}'s judicial background, ruling patterns, and case outcomes${experienceText}. Find experienced attorneys and get essential legal insights for your case strategy.`
}

/**
 * Generate comprehensive keywords for search dominance
 * Covers all possible search variations and patterns
 */
function generateComprehensiveKeywords(
  name: string,
  firstName: string,
  lastName: string,
  fullNameNoMiddle: string,
  courtName: string,
  jurisdiction: string,
  courtType: string,
  jurisdictionType: string
): string[] {
  const keywords = new Set<string>()
  
  // Primary name variations
  keywords.add(name)
  keywords.add(`Judge ${name}`)
  keywords.add(`Justice ${name}`)
  keywords.add(`The Honorable ${name}`)
  keywords.add(`Hon. ${name}`)
  keywords.add(`Honorable ${name}`)
  
  // First/Last name combinations (common searches)
  if (firstName && lastName) {
    keywords.add(`${firstName} ${lastName}`)
    keywords.add(`Judge ${firstName} ${lastName}`)
    keywords.add(`Justice ${firstName} ${lastName}`)
  }
  
  if (fullNameNoMiddle !== name) {
    keywords.add(fullNameNoMiddle)
    keywords.add(`Judge ${fullNameNoMiddle}`)
  }
  
  // Court and location targeting
  keywords.add(`${name} ${courtName}`)
  keywords.add(`${name} ${jurisdiction}`)
  keywords.add(`${name} ${courtType}`)
  keywords.add(`${name} ${jurisdiction} ${courtType}`)
  keywords.add(`${jurisdiction} ${courtType} judges`)
  keywords.add(`${courtName} judges`)
  keywords.add(`judges ${jurisdiction}`)
  keywords.add(`judges in ${jurisdiction}`)
  keywords.add(`${courtType} judges ${jurisdiction}`)
  
  // Professional legal terms
  keywords.add(`${name} judicial analytics`)
  keywords.add(`${name} ruling patterns`)
  keywords.add(`${name} case outcomes`)
  keywords.add(`${name} sentencing patterns`)
  keywords.add(`${name} judicial decisions`)
  keywords.add(`${name} court record`)
  keywords.add(`${name} background`)
  keywords.add(`${name} biography`)
  keywords.add(`${name} judicial history`)
  keywords.add(`${name} legal career`)
  keywords.add(`${name} appointment`)
  keywords.add(`${name} tenure`)
  
  // Attorney and legal professional searches
  keywords.add(`attorneys before Judge ${name}`)
  keywords.add(`lawyers ${name} court`)
  keywords.add(`appearing before Judge ${name}`)
  keywords.add(`${name} attorney directory`)
  keywords.add(`experienced attorneys ${courtName}`)
  keywords.add(`best attorneys ${name}`)
  keywords.add(`lawyers with experience before ${name}`)
  keywords.add(`${name} court attorneys`)
  keywords.add(`practicing before Judge ${name}`)
  
  // Voice search and natural language patterns
  keywords.add(`who is Judge ${name}`)
  keywords.add(`about Judge ${name}`)
  keywords.add(`Judge ${name} information`)
  keywords.add(`what court does Judge ${name} serve`)
  keywords.add(`where does Judge ${name} work`)
  keywords.add(`Judge ${name} contact`)
  keywords.add(`how to contact Judge ${name}`)
  keywords.add(`Judge ${name} office`)
  keywords.add(`Judge ${name} chamber`)
  
  // Research and strategy terms
  keywords.add('judicial research')
  keywords.add('legal analytics')
  keywords.add('court research')
  keywords.add('case strategy')
  keywords.add('judicial intelligence')
  keywords.add('legal intelligence')
  keywords.add('judge research')
  keywords.add('court analytics')
  keywords.add('judicial data')
  keywords.add('legal research tools')
  keywords.add('case preparation')
  keywords.add('litigation strategy')
  
  // Location-specific variations
  keywords.add(`California judges`)
  keywords.add(`${jurisdiction} County judges`)
  keywords.add(`${jurisdiction} court system`)
  keywords.add(`${jurisdiction} judicial directory`)
  keywords.add(`California ${courtType}`)
  keywords.add(`${jurisdiction} legal system`)
  
  // Case type variations (common searches)
  const caseTypes = [
    'civil', 'criminal', 'family', 'probate', 'personal injury',
    'divorce', 'custody', 'real estate', 'business', 'contract',
    'employment', 'immigration', 'bankruptcy', 'appeals'
  ]
  
  caseTypes.forEach(caseType => {
    keywords.add(`${name} ${caseType} cases`)
    keywords.add(`Judge ${name} ${caseType}`)
    keywords.add(`${caseType} judge ${jurisdiction}`)
  })
  
  // Educational and professional background terms
  keywords.add(`${name} education`)
  keywords.add(`${name} law school`)
  keywords.add(`${name} career`)
  keywords.add(`${name} qualifications`)
  keywords.add(`${name} credentials`)
  keywords.add(`${name} professional background`)
  
  // Current and trending legal terms
  keywords.add('judge finder')
  keywords.add('judicial transparency')
  keywords.add('court transparency')
  keywords.add('judicial accountability')
  keywords.add('judge lookup')
  keywords.add('find a judge')
  keywords.add('judicial profiles')
  keywords.add('court directory')
  
  return Array.from(keywords).filter(keyword => keyword.length > 0)
}

/**
 * Generate alternate URLs for comprehensive sitemap coverage
 */
function generateAlternateUrls(name: string, baseUrl: string): string[] {
  const urls = new Set<string>()
  const canonicalSlug = createCanonicalSlug(name)
  
  // Primary canonical URL
  urls.add(`${baseUrl}/judges/${canonicalSlug}`)
  
  // Common variations that redirect to canonical
  urls.add(`${baseUrl}/judges/judge-${canonicalSlug}`)
  urls.add(`${baseUrl}/judges/justice-${canonicalSlug}`)
  urls.add(`${baseUrl}/judges/honorable-${canonicalSlug}`)
  
  // First/last name only variations
  const parsed = parseJudgeName(name)
  if (parsed.firstName && parsed.lastName) {
    const firstLastSlug = createCanonicalSlug(`${parsed.firstName} ${parsed.lastName}`)
    urls.add(`${baseUrl}/judges/${firstLastSlug}`)
  }
  
  return Array.from(urls)
}