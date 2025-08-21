/**
 * Dynamic content generation for unique judge descriptions
 * Creates jurisdiction-specific and experience-based content variations
 * to avoid duplicate content issues and improve search rankings
 */

import type { Judge } from '@/types'
import { parseJudgeName } from '@/lib/utils/slug'

interface ContentVariations {
  uniqueDescription: string
  jurisdictionSpecific: string
  practiceAreas: string[]
  keyHighlights: string[]
  professionalSummary: string
}

/**
 * Generate unique content for each judge profile
 * Uses template variations and judge-specific data to create distinctive content
 */
export function generateUniqueJudgeContent(judge: Judge): ContentVariations {
  const safeName = judge.name || 'Unknown Judge'
  const safeCourtName = judge.court_name || 'Unknown Court'
  const safeJurisdiction = judge.jurisdiction || 'Unknown Jurisdiction'
  
  const parsedName = parseJudgeName(safeName)
  const firstName = parsedName.firstName || safeName.split(' ')[0]
  const experience = calculateJudicialExperience(judge.appointed_date || undefined)
  const courtType = classifyCourtSpecialty(safeCourtName)
  
  return {
    uniqueDescription: generateUniqueDescription(judge, experience, courtType),
    jurisdictionSpecific: generateJurisdictionContent(judge, safeJurisdiction),
    practiceAreas: identifyPracticeAreas(safeCourtName, safeJurisdiction),
    keyHighlights: generateKeyHighlights(judge, experience, courtType),
    professionalSummary: generateProfessionalSummary(judge, experience, firstName)
  }
}

/**
 * Generate unique description avoiding duplicate content
 */
function generateUniqueDescription(
  judge: Judge, 
  experience: { years: number; description: string; tier: string },
  courtType: string
): string {
  const name = judge.name || 'Unknown Judge'
  const courtName = judge.court_name || 'Court'
  const jurisdiction = judge.jurisdiction || 'California'
  
  // Use experience tier and court type to create unique variations
  const templates = {
    veteran: [
      `${name} brings extensive judicial experience to ${courtName}, serving ${jurisdiction} with ${experience.description} of distinguished service. Known for fair and thorough proceedings, ${name} has handled thousands of cases across multiple legal areas.`,
      `As a veteran member of ${courtName}, ${name} has established a reputation for judicial excellence in ${jurisdiction}. With ${experience.description} on the bench, ${name} demonstrates consistent legal expertise and courtroom leadership.`,
      `${name} serves as a senior judge at ${courtName}, bringing ${experience.description} of judicial wisdom to ${jurisdiction}. Recognized for scholarly approach and procedural expertise, ${name} continues to shape legal precedent in the region.`
    ],
    experienced: [
      `${name} presides over ${courtName} with proven judicial competence, having served ${jurisdiction} for ${experience.description}. Known for efficient case management and clear legal reasoning, ${name} handles complex litigation with expertise.`,
      `Serving ${jurisdiction} at ${courtName}, ${name} has built a solid judicial record over ${experience.description}. ${name} is recognized for thorough case preparation and fair application of legal principles in diverse proceedings.`,
      `${name} brings established judicial experience to ${courtName}, serving ${jurisdiction} with ${experience.description} of dedicated service. Known for balanced decision-making and legal scholarship, ${name} manages a diverse caseload effectively.`
    ],
    newer: [
      `${name} serves ${jurisdiction} at ${courtName}, bringing fresh perspective and rigorous legal training to the bench. With a commitment to judicial excellence, ${name} handles cases with careful attention to legal precedent and procedure.`,
      `As a member of ${courtName}, ${name} applies contemporary legal knowledge to serve ${jurisdiction}. Known for thorough case analysis and adherence to judicial standards, ${name} demonstrates strong commitment to justice and legal precision.`,
      `${name} presides at ${courtName} with dedication to serving ${jurisdiction} through fair and informed judicial decisions. Bringing modern legal expertise to the bench, ${name} ensures proper application of legal standards in all proceedings.`
    ]
  }
  
  const tierTemplates = templates[experience.tier as keyof typeof templates] || templates.newer
  const templateIndex = Math.abs(name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % tierTemplates.length
  
  return tierTemplates[templateIndex]
}

/**
 * Generate jurisdiction-specific content
 */
function generateJurisdictionContent(judge: Judge, jurisdiction: string): string {
  const name = judge.name || 'Unknown Judge'
  const courtName = judge.court_name || 'Court'
  
  const jurisdictionInfo: { [key: string]: { description: string; specialties: string; community: string; legal_climate: string } } = {
    'Orange County': {
      description: 'Orange County\'s diverse legal landscape',
      specialties: 'business litigation, family law, and real estate disputes',
      community: 'serving one of California\'s most populous counties',
      legal_climate: 'Orange County\'s sophisticated legal environment'
    },
    'Los Angeles County': {
      description: 'Los Angeles County\'s complex judicial system',
      specialties: 'entertainment law, international business, and complex civil litigation',
      community: 'serving the nation\'s most populous county',
      legal_climate: 'LA County\'s dynamic and fast-paced legal environment'
    },
    'San Francisco County': {
      description: 'San Francisco\'s progressive legal framework',
      specialties: 'technology law, intellectual property, and commercial disputes',
      community: 'serving the Bay Area\'s innovation hub',
      legal_climate: 'San Francisco\'s cutting-edge legal landscape'
    },
    'San Diego County': {
      description: 'San Diego County\'s border jurisdiction complexities',
      specialties: 'immigration law, international trade, and military legal matters',
      community: 'serving Southern California\'s border region',
      legal_climate: 'San Diego\'s unique cross-border legal environment'
    },
    'Sacramento County': {
      description: 'Sacramento County\'s government-centered legal system',
      specialties: 'administrative law, government relations, and regulatory matters',
      community: 'serving California\'s capital region',
      legal_climate: 'Sacramento\'s government-focused legal environment'
    },
    'California': {
      description: 'California\'s comprehensive state judicial system',
      specialties: 'diverse legal matters across all practice areas',
      community: 'serving the Golden State',
      legal_climate: 'California\'s leading legal jurisdiction'
    }
  }
  
  const info = jurisdictionInfo[jurisdiction] || jurisdictionInfo['California']
  
  const templates = [
    `${name} serves within ${info.description}, handling ${info.specialties} at ${courtName}. As part of ${info.community}, ${name} addresses the unique legal challenges of ${info.legal_climate}.`,
    `Operating within ${info.legal_climate}, ${name} at ${courtName} specializes in ${info.specialties}. ${name} contributes to ${info.description} while ${info.community}.`,
    `${name} brings judicial expertise to ${info.legal_climate} at ${courtName}, focusing on ${info.specialties}. As part of ${info.description}, ${name} serves ${info.community}.`
  ]
  
  const templateIndex = Math.abs(name.length + jurisdiction.length) % templates.length
  return templates[templateIndex]
}

/**
 * Identify practice areas based on court name and jurisdiction
 */
function identifyPracticeAreas(courtName: string, jurisdiction: string): string[] {
  const areas = new Set<string>()
  const lowerCourtName = courtName.toLowerCase()
  
  // Court-specific practice areas
  if (lowerCourtName.includes('superior')) {
    areas.add('Civil Litigation')
    areas.add('Criminal Law')
    areas.add('Family Law')
    areas.add('Probate Law')
  }
  
  if (lowerCourtName.includes('family')) {
    areas.add('Family Law')
    areas.add('Child Custody')
    areas.add('Divorce Proceedings')
    areas.add('Domestic Relations')
  }
  
  if (lowerCourtName.includes('criminal')) {
    areas.add('Criminal Law')
    areas.add('Criminal Sentencing')
    areas.add('Drug Offenses')
    areas.add('Violent Crimes')
  }
  
  if (lowerCourtName.includes('civil')) {
    areas.add('Civil Litigation')
    areas.add('Contract Disputes')
    areas.add('Personal Injury')
    areas.add('Business Law')
  }
  
  if (lowerCourtName.includes('appeal')) {
    areas.add('Appellate Law')
    areas.add('Legal Appeals')
    areas.add('Appellate Procedure')
    areas.add('Case Review')
  }
  
  // Jurisdiction-specific specialties
  const jurisdictionSpecialties: { [key: string]: string[] } = {
    'Orange County': ['Business Law', 'Real Estate Law', 'Technology Disputes'],
    'Los Angeles County': ['Entertainment Law', 'International Business', 'Media Law'],
    'San Francisco County': ['Technology Law', 'Intellectual Property', 'Startup Law'],
    'San Diego County': ['Immigration Law', 'International Trade', 'Military Law'],
    'Sacramento County': ['Administrative Law', 'Government Relations', 'Regulatory Law']
  }
  
  const specialties = jurisdictionSpecialties[jurisdiction] || ['General Civil Law', 'Criminal Law', 'Family Law']
  specialties.forEach((specialty: string) => areas.add(specialty))
  
  // Default areas if none identified
  if (areas.size === 0) {
    areas.add('General Civil Law')
    areas.add('Criminal Proceedings')
    areas.add('Legal Disputes')
  }
  
  return Array.from(areas).slice(0, 6) // Limit to 6 areas
}

/**
 * Generate key highlights for the judge
 */
function generateKeyHighlights(
  judge: Judge, 
  experience: { years: number; tier: string },
  courtType: string
): string[] {
  const highlights = []
  const name = judge.name || 'Unknown Judge'
  const jurisdiction = judge.jurisdiction || 'California'
  
  // Experience-based highlights
  if (experience.years >= 15) {
    highlights.push(`Veteran judicial officer with ${experience.years}+ years experience`)
    highlights.push('Senior member of the judicial bench')
    highlights.push('Extensive case law and precedent knowledge')
  } else if (experience.years >= 5) {
    highlights.push(`Experienced judge with ${experience.years}+ years service`)
    highlights.push('Proven track record in case management')
    highlights.push('Strong judicial decision-making experience')
  } else {
    highlights.push('Dedicated judicial service')
    highlights.push('Contemporary legal knowledge and training')
    highlights.push('Commitment to fair and efficient proceedings')
  }
  
  // Court-specific highlights
  if (courtType.includes('Superior')) {
    highlights.push('General jurisdiction court experience')
    highlights.push('Diverse caseload management')
  }
  
  if (courtType.includes('Appeal')) {
    highlights.push('Appellate court expertise')
    highlights.push('Legal precedent analysis')
  }
  
  if (courtType.includes('Family')) {
    highlights.push('Family law specialization')
    highlights.push('Domestic relations expertise')
  }
  
  // Jurisdiction highlights
  highlights.push(`Serving ${jurisdiction} legal community`)
  highlights.push('Active in local legal proceedings')
  
  return highlights.slice(0, 5) // Limit to 5 highlights
}

/**
 * Generate professional summary
 */
function generateProfessionalSummary(
  judge: Judge, 
  experience: { years: number; tier: string; description: string },
  firstName: string
): string {
  const name = judge.name || 'Unknown Judge'
  const courtName = judge.court_name || 'the court'
  const jurisdiction = judge.jurisdiction || 'California'
  
  const summaryTemplates = {
    veteran: [
      `${firstName} has distinguished themselves as a veteran judicial officer, bringing ${experience.description} of legal expertise to ${courtName}. Known for scholarly approach and consistent application of legal principles, ${firstName} has shaped countless legal proceedings throughout ${jurisdiction}.`,
      `With ${experience.description} of judicial service, ${firstName} represents institutional knowledge and legal wisdom at ${courtName}. ${firstName}'s extensive experience in ${jurisdiction} has contributed to stable and reliable legal proceedings across diverse case types.`
    ],
    experienced: [
      `${firstName} brings proven judicial competence to ${courtName}, with ${experience.description} of dedicated service to ${jurisdiction}. Known for efficient case management and fair legal reasoning, ${firstName} has established a solid reputation in the legal community.`,
      `As an experienced member of ${courtName}, ${firstName} has served ${jurisdiction} with ${experience.description} of professional judicial conduct. ${firstName} is recognized for balanced decision-making and thorough legal analysis.`
    ],
    newer: [
      `${firstName} serves ${jurisdiction} at ${courtName} with dedication to judicial excellence and legal precision. Bringing contemporary legal training and fresh perspective, ${firstName} demonstrates strong commitment to fair and informed judicial decisions.`,
      `${firstName} applies rigorous legal standards and modern judicial practices at ${courtName}, serving ${jurisdiction} with careful attention to legal procedure and precedent. Known for thorough preparation and professional conduct.`
    ]
  }
  
  const templates = summaryTemplates[experience.tier as keyof typeof summaryTemplates] || summaryTemplates.newer
  const templateIndex = Math.abs(firstName.length) % templates.length
  
  return templates[templateIndex]
}

/**
 * Calculate judicial experience details
 */
function calculateJudicialExperience(appointedDate?: string): {
  years: number
  description: string
  tier: string
} {
  if (!appointedDate) {
    return {
      years: 0,
      description: 'current judicial service',
      tier: 'newer'
    }
  }
  
  try {
    const years = new Date().getFullYear() - new Date(appointedDate).getFullYear()
    
    let tier: string
    if (years >= 15) tier = 'veteran'
    else if (years >= 5) tier = 'experienced'
    else tier = 'newer'
    
    const description = years > 0 ? `${years} years` : 'current judicial service'
    
    return { years, description, tier }
  } catch {
    return {
      years: 0,
      description: 'current judicial service',
      tier: 'newer'
    }
  }
}

/**
 * Classify court specialty for content targeting
 */
function classifyCourtSpecialty(courtName: string): string {
  const name = courtName.toLowerCase()
  
  if (name.includes('superior')) return 'Superior Court'
  if (name.includes('appeal')) return 'Appellate Court'
  if (name.includes('supreme')) return 'Supreme Court'
  if (name.includes('family')) return 'Family Court'
  if (name.includes('criminal')) return 'Criminal Court'
  if (name.includes('civil')) return 'Civil Court'
  if (name.includes('probate')) return 'Probate Court'
  if (name.includes('juvenile')) return 'Juvenile Court'
  if (name.includes('traffic')) return 'Traffic Court'
  
  return 'General Court'
}

/**
 * Generate related judges content for internal linking
 */
export function generateRelatedJudges(
  currentJudge: Judge,
  allJudges: Judge[]
): Judge[] {
  const related: Judge[] = []
  const currentCourt = currentJudge.court_name?.toLowerCase() || ''
  const currentJurisdiction = currentJudge.jurisdiction?.toLowerCase() || ''
  
  // Same court judges
  const sameCourtJudges = allJudges.filter(judge => 
    judge.id !== currentJudge.id &&
    judge.court_name?.toLowerCase() === currentCourt
  ).slice(0, 3)
  
  related.push(...sameCourtJudges)
  
  // Same jurisdiction judges (if we need more)
  if (related.length < 5) {
    const sameJurisdictionJudges = allJudges.filter(judge =>
      judge.id !== currentJudge.id &&
      judge.jurisdiction?.toLowerCase() === currentJurisdiction &&
      !related.some(r => r.id === judge.id)
    ).slice(0, 5 - related.length)
    
    related.push(...sameJurisdictionJudges)
  }
  
  return related.slice(0, 5)
}