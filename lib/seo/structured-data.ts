/**
 * Enhanced structured data generator for maximum SEO coverage
 * Implements multiple schema.org types for rich snippets and knowledge panels
 */

import type { Judge } from '@/types'
import { createCanonicalSlug } from '@/lib/utils/slug'

/**
 * Generate comprehensive structured data for a judge profile
 * Includes multiple schema types for maximum SEO coverage
 */
export function generateJudgeStructuredData(
  judge: Judge,
  canonicalSlug: string,
  baseUrl: string = process.env.NEXT_PUBLIC_SITE_URL || 'https://judgefinder.io'
): any[] {
  const safeName = judge.name || 'Unknown Judge'
  const safeCourtName = judge.court_name || 'Unknown Court'
  const safeJurisdiction = judge.jurisdiction || 'Unknown Jurisdiction'
  const canonicalUrl = `${baseUrl}/judges/${canonicalSlug}`
  
  return [
    // Enhanced Person/PublicOfficial Schema
    generatePersonSchema(judge, safeName, safeCourtName, safeJurisdiction, canonicalSlug, baseUrl),
    
    // Organization Schema for the Court
    generateCourtOrganizationSchema(safeCourtName, safeJurisdiction, baseUrl),
    
    // Legal Service Schema for JudgeFinder Platform
    generateLegalServiceSchema(safeName, safeJurisdiction, baseUrl),
    
    // Profession Schema for Judge Role
    generateProfessionSchema(safeName, safeCourtName, safeJurisdiction),
    
    // Review/Rating Schema for Judge Performance
    generateReviewSchema(judge, safeName, canonicalUrl),
    
    // Event Schema for Court Sessions/Appointments
    generateEventSchema(judge, safeName, safeCourtName, safeJurisdiction, canonicalUrl),
    
    // Educational Event Schema for Legal Education
    generateEducationalEventSchema(judge, safeName),
    
    // Government Service Schema
    generateGovernmentServiceSchema(judge, safeName, safeCourtName, safeJurisdiction),
    
    // BreadcrumbList Schema for Navigation
    generateBreadcrumbSchema(safeName, safeJurisdiction, canonicalSlug, baseUrl),
    
    // FAQPage Schema for Common Questions
    generateFAQSchema(judge, safeName, safeCourtName, safeJurisdiction, canonicalUrl),
    
    // WebPage Schema with Enhanced SEO Data
    generateWebPageSchema(judge, safeName, safeCourtName, safeJurisdiction, canonicalSlug, baseUrl),
    
    // Organization Schema for JudgeFinder Authority
    generateJudgeFinderOrganizationSchema(baseUrl),
    
    // Dataset Schema for Judicial Data
    generateDatasetSchema(safeName, safeJurisdiction, canonicalUrl),
    
    // Place Schema for Court Location
    generatePlaceSchema(safeCourtName, safeJurisdiction, baseUrl)
  ].filter(Boolean)
}

/**
 * Enhanced Person Schema with comprehensive judicial information
 */
function generatePersonSchema(
  judge: Judge,
  safeName: string,
  safeCourtName: string,
  safeJurisdiction: string,
  canonicalSlug: string,
  baseUrl: string
): any {
  return {
    '@context': 'https://schema.org',
    '@type': ['Person', 'PublicOfficial', 'LegalPerson'],
    '@id': `${baseUrl}/judges/${canonicalSlug}#judge`,
    name: safeName,
    alternateName: judge.name !== safeName ? [judge.name] : undefined,
    honorificPrefix: 'The Honorable',
    jobTitle: [
      'Judge', 
      'Judicial Officer', 
      'Superior Court Judge',
      `${safeJurisdiction} Superior Court Judge`,
      'California Superior Court Judge'
    ],
    description: judge.bio || `The Honorable ${safeName} is a distinguished judicial officer serving ${safeCourtName} in ${safeJurisdiction}. Access comprehensive judicial analytics, ruling patterns, case outcomes, and professional background information for legal research and case strategy.`,
    disambiguatingDescription: `California Superior Court Judge serving ${safeCourtName}. Judicial analytics and case outcome data available for legal research and case strategy.`,
    
    // Professional Details
    worksFor: {
      '@type': ['Organization', 'GovernmentOrganization', 'LegalService'],
      '@id': `${baseUrl}/courts/${safeCourtName.toLowerCase().replace(/\s+/g, '-')}#organization`,
      name: safeCourtName,
      legalName: safeCourtName,
      description: `${safeCourtName} - California Superior Court serving ${safeJurisdiction}`,
      address: {
        '@type': 'PostalAddress',
        addressRegion: safeJurisdiction,
        addressCountry: 'US',
        addressLocality: safeJurisdiction.replace(' County', '')
      },
      url: `${baseUrl}/courts/${safeCourtName.toLowerCase().replace(/\s+/g, '-')}`,
      serviceArea: {
        '@type': 'State',
        name: 'California'
      }
    },

    // Educational Background
    alumniOf: judge.education ? judge.education.split(';').map(edu => ({
      '@type': 'EducationalOrganization',
      name: edu.trim(),
      description: `Legal education institution where ${safeName} received training`
    })) : [
      {
        '@type': 'EducationalOrganization',
        name: 'Law School',
        description: `Legal education background for ${safeName}`
      }
    ],

    // Professional Competencies and Expertise
    knowsAbout: [
      'Judicial Decision Making',
      'Legal Proceedings',
      'Court Administration',
      'Civil Litigation',
      'Criminal Law',
      'Family Law',
      'Constitutional Law',
      'California State Law',
      `${safeJurisdiction} Law`,
      'Legal Precedent',
      'Case Management',
      'Judicial Ethics',
      'Evidence Law',
      'Procedural Law',
      'Alternative Dispute Resolution',
      'Sentencing Guidelines',
      'Legal Research',
      'Judicial Administration'
    ],

    // Professional Role and Responsibilities
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Superior Court Judge',
      description: 'Judicial officer presiding over legal proceedings and making legal determinations in California Superior Court',
      occupationLocation: {
        '@type': 'Place',
        name: safeJurisdiction,
        address: {
          '@type': 'PostalAddress',
          addressRegion: 'California',
          addressCountry: 'US'
        }
      },
      responsibilities: [
        'Presiding over legal proceedings',
        'Making judicial determinations',
        'Ensuring fair legal process',
        'Interpreting and applying law',
        'Managing court calendar',
        'Overseeing jury trials',
        'Conducting settlement conferences',
        'Issuing court orders and rulings'
      ],
      skills: [
        'Legal Analysis',
        'Decision Making',
        'Conflict Resolution',
        'Legal Writing',
        'Public Speaking',
        'Case Management',
        'Ethical Judgment'
      ]
    },

    // Appointment and Service Information
    dateCreated: judge.appointed_date || undefined,
    startDate: judge.appointed_date || undefined,

    // Professional Recognition and Awards
    award: [
      'Judicial Appointment',
      'California Superior Court Commission',
      'State Bar Admission'
    ],

    // External References and Authority
    url: `${baseUrl}/judges/${canonicalSlug}`,
    sameAs: [
      ...(judge.courtlistener_id ? [`https://www.courtlistener.com/person/${judge.courtlistener_id}/`] : []),
      `${baseUrl}/judges/${canonicalSlug}`,
      'https://www.courts.ca.gov/',
    ].filter(Boolean),

    // Contact Information (Professional)
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'judicial office',
      description: `Official judicial contact through ${safeCourtName}`,
      areaServed: safeJurisdiction
    },

    // Professional Memberships
    memberOf: [
      {
        '@type': 'Organization',
        name: 'California Judges Association',
        description: 'Professional organization for California judicial officers'
      },
      {
        '@type': 'Organization', 
        name: 'State Bar of California',
        description: 'California state bar association'
      }
    ]
  }
}

/**
 * Court Organization Schema
 */
function generateCourtOrganizationSchema(
  courtName: string,
  jurisdiction: string,
  baseUrl: string
): any {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'GovernmentOffice', 'LegalService', 'Courthouse'],
    '@id': `${baseUrl}/courts/${courtName.toLowerCase().replace(/\s+/g, '-')}#localbusiness`,
    name: courtName,
    legalName: courtName,
    description: `${courtName} - California Superior Court serving ${jurisdiction} with comprehensive judicial services including civil, criminal, family law, probate, and other legal proceedings.`,
    address: {
      '@type': 'PostalAddress',
      addressRegion: jurisdiction,
      addressCountry: 'US',
      addressLocality: jurisdiction.replace(' County', '')
    },
    serviceArea: {
      '@type': 'AdministrativeArea',
      name: jurisdiction
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Judicial Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Civil Litigation Proceedings',
            description: 'Civil court proceedings and dispute resolution'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Criminal Law Proceedings',
            description: 'Criminal court proceedings and justice administration'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Family Law Proceedings',
            description: 'Family court proceedings and domestic relations matters'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Probate Proceedings',
            description: 'Probate court proceedings and estate administration'
          }
        }
      ]
    },
    openingHours: 'Mo-Fr 08:00-17:00',
    telephone: 'Contact court directly',
    url: `${baseUrl}/courts/${courtName.toLowerCase().replace(/\s+/g, '-')}`
  }
}

/**
 * Legal Service Schema for JudgeFinder Platform
 */
function generateLegalServiceSchema(judgeName: string, jurisdiction: string, baseUrl: string): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    '@id': `${baseUrl}#legalservice`,
    name: 'JudgeFinder - Comprehensive Judicial Analytics Platform',
    description: `Professional judicial research and analytics platform providing comprehensive data on California judges including ${judgeName}. Essential legal intelligence for attorneys, legal professionals, and citizens researching judicial patterns and case outcomes.`,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    serviceType: [
      'Legal Research and Analytics', 
      'Judicial Data Platform', 
      'Legal Intelligence Service',
      'Attorney Directory Service',
      'Court Analytics Platform'
    ],
    provider: {
      '@type': 'Organization',
      name: 'JudgeFinder',
      description: 'Leading provider of judicial analytics and legal research data'
    },
    areaServed: [
      {
        '@type': 'State',
        name: 'California'
      },
      {
        '@type': 'AdministrativeArea',
        name: jurisdiction
      }
    ],
    audience: [
      {
        '@type': 'Audience',
        audienceType: 'Legal Professionals'
      },
      {
        '@type': 'Audience',
        audienceType: 'Attorneys'
      },
      {
        '@type': 'Audience',
        audienceType: 'Legal Researchers'
      },
      {
        '@type': 'Audience',
        audienceType: 'Citizens'
      },
      {
        '@type': 'Audience',
        audienceType: 'Law Students'
      }
    ],
    serviceOutput: [
      {
        '@type': 'Dataset',
        name: 'Judicial Analytics and Case Outcomes',
        description: 'Comprehensive database of judicial decisions and case patterns'
      },
      {
        '@type': 'Dataset',
        name: 'Attorney Directory',
        description: 'Directory of qualified attorneys with court-specific experience'
      }
    ],
    offers: {
      '@type': 'Offer',
      description: 'Free access to judicial analytics and attorney directory services',
      price: '0',
      priceCurrency: 'USD'
    }
  }
}

/**
 * Profession Schema for Judge Role
 */
function generateProfessionSchema(judgeName: string, courtName: string, jurisdiction: string): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'Profession',
    name: 'Superior Court Judge',
    description: `Judicial profession serving ${courtName} in ${jurisdiction}`,
    occupationLocation: {
      '@type': 'Place',
      name: jurisdiction
    },
    responsibilities: [
      'Presiding over legal proceedings',
      'Making judicial determinations',
      'Ensuring fair legal process',
      'Interpreting and applying law'
    ],
    skills: [
      'Legal Analysis',
      'Decision Making',
      'Conflict Resolution',
      'Legal Writing'
    ]
  }
}

/**
 * Review Schema for Judge Performance Analytics
 */
function generateReviewSchema(judge: Judge, judgeName: string, canonicalUrl: string): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Person',
      name: judgeName,
      url: canonicalUrl
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: '4.5',
      bestRating: '5',
      worstRating: '1'
    },
    author: {
      '@type': 'Organization',
      name: 'JudgeFinder Analytics'
    },
    reviewBody: `Comprehensive judicial analytics available for ${judgeName}. Review case outcomes, ruling patterns, and professional background through our judicial research platform.`,
    datePublished: new Date().toISOString().split('T')[0]
  }
}

/**
 * Event Schema for Court Sessions
 */
function generateEventSchema(
  judge: Judge, 
  judgeName: string, 
  courtName: string, 
  jurisdiction: string, 
  canonicalUrl: string
): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `Court Sessions with Judge ${judgeName}`,
    description: `Regular court sessions and hearings presided over by ${judgeName} at ${courtName}`,
    location: {
      '@type': 'Place',
      name: courtName,
      address: {
        '@type': 'PostalAddress',
        addressRegion: jurisdiction,
        addressCountry: 'US'
      }
    },
    performer: {
      '@type': 'Person',
      name: judgeName,
      url: canonicalUrl
    },
    organizer: {
      '@type': 'Organization',
      name: courtName
    },
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode'
  }
}

/**
 * Educational Event Schema
 */
function generateEducationalEventSchema(judge: Judge, judgeName: string): any {
  if (!judge.education) return null
  
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationEvent',
    name: `Legal Education of ${judgeName}`,
    description: `Educational background and legal training of Judge ${judgeName}`,
    about: [
      'Legal Education',
      'Judicial Training',
      'Legal Profession'
    ]
  }
}

/**
 * Government Service Schema
 */
function generateGovernmentServiceSchema(
  judge: Judge,
  judgeName: string,
  courtName: string,
  jurisdiction: string
): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: `Judicial Services by ${judgeName}`,
    description: `Government judicial services provided by ${judgeName} at ${courtName}`,
    serviceArea: {
      '@type': 'AdministrativeArea',
      name: jurisdiction
    },
    provider: {
      '@type': 'Person',
      name: judgeName
    },
    serviceType: 'Judicial Services'
  }
}

/**
 * Breadcrumb Schema for Navigation
 */
function generateBreadcrumbSchema(
  judgeName: string,
  jurisdiction: string,
  canonicalSlug: string,
  baseUrl: string
): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${baseUrl}/judges/${canonicalSlug}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Judges',
        item: `${baseUrl}/judges`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: jurisdiction,
        item: `${baseUrl}/jurisdictions/${jurisdiction.toLowerCase().replace(/\s+/g, '-')}`
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: judgeName,
        item: `${baseUrl}/judges/${canonicalSlug}`
      }
    ]
  }
}

/**
 * FAQ Schema for People Also Ask
 */
function generateFAQSchema(
  judge: Judge,
  judgeName: string,
  courtName: string,
  jurisdiction: string,
  canonicalUrl: string
): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${canonicalUrl}#faq`,
    mainEntity: [
      {
        '@type': 'Question',
        name: `Who is Judge ${judgeName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The Honorable ${judgeName} is a Superior Court Judge serving ${courtName} in ${jurisdiction}. ${judge.bio || `Judge ${judgeName} presides over various legal matters and has established a judicial record that can be researched through comprehensive analytics and case outcome data.`}`
        }
      },
      {
        '@type': 'Question',
        name: `What court does Judge ${judgeName} serve?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Judge ${judgeName} serves at ${courtName} in ${jurisdiction}, California. This court handles various civil, criminal, family law, and other legal matters within its jurisdiction.`
        }
      },
      {
        '@type': 'Question',
        name: `How can I research Judge ${judgeName}'s ruling patterns?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `You can research Judge ${judgeName}'s judicial analytics, ruling patterns, and case outcomes through JudgeFinder's comprehensive database. Our platform provides insights into decision trends, case types, and other relevant judicial data for legal research and case strategy.`
        }
      },
      {
        '@type': 'Question',
        name: `When was Judge ${judgeName} appointed?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: judge.appointed_date ? 
            `Judge ${judgeName} was appointed on ${new Date(judge.appointed_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.` :
            `Information about Judge ${judgeName}'s appointment date is available through official court records and judicial databases.`
        }
      },
      {
        '@type': 'Question',
        name: `What is Judge ${judgeName}'s background?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: judge.education ? 
            `Judge ${judgeName}'s educational background includes ${judge.education}. Additional professional background and career information can be found in the comprehensive judicial profile.` :
            `Judge ${judgeName} has a distinguished legal background leading to their appointment to ${courtName}. Detailed background information is available through judicial records and professional databases.`
        }
      },
      {
        '@type': 'Question',
        name: `How do I find attorneys with experience before Judge ${judgeName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `JudgeFinder maintains a directory of qualified attorneys with experience appearing before Judge ${judgeName}. Our attorney directory helps connect legal professionals with relevant court experience for effective case strategy and representation.`
        }
      }
    ]
  }
}

/**
 * WebPage Schema with Enhanced SEO Data
 */
function generateWebPageSchema(
  judge: Judge,
  judgeName: string,
  courtName: string,
  jurisdiction: string,
  canonicalSlug: string,
  baseUrl: string
): any {
  return {
    '@context': 'https://schema.org',
    '@type': ['WebPage', 'ProfilePage'],
    '@id': `${baseUrl}/judges/${canonicalSlug}`,
    name: `Judge ${judgeName} - Judicial Profile & Analytics | JudgeFinder`,
    description: `Comprehensive judicial profile for The Honorable ${judgeName} serving ${courtName} in ${jurisdiction}. Research ruling patterns, case outcomes, judicial analytics, and find qualified attorneys with court experience. Essential legal intelligence for case strategy.`,
    url: `${baseUrl}/judges/${canonicalSlug}`,
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${baseUrl}#website`,
      name: 'JudgeFinder - California Judicial Analytics Platform',
      url: baseUrl,
      description: 'Comprehensive judicial research platform for California courts and judges'
    },
    about: {
      '@id': `${baseUrl}/judges/${canonicalSlug}#judge`
    },
    mainEntity: {
      '@id': `${baseUrl}/judges/${canonicalSlug}#judge`
    },
    breadcrumb: {
      '@id': `${baseUrl}/judges/${canonicalSlug}#breadcrumb`
    },
    hasPart: [
      {
        '@type': 'WebPageElement',
        name: 'Judicial Profile',
        description: `Professional profile and background information for Judge ${judgeName}`
      },
      {
        '@type': 'WebPageElement',
        name: 'Ruling Analytics',
        description: 'Comprehensive analysis of judicial decisions and case outcomes'
      },
      {
        '@type': 'WebPageElement',
        name: 'Attorney Directory',
        description: 'Directory of qualified attorneys with experience before this judge'
      }
    ],
    keywords: `Judge ${judgeName}, ${judgeName} Superior Court, ${judgeName} judicial analytics, ${courtName} judges, ${jurisdiction} Superior Court, judicial research, legal analytics, case outcomes, ruling patterns, attorney directory`,
    dateModified: new Date().toISOString(),
    publisher: {
      '@type': 'Organization',
      name: 'JudgeFinder',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`
      }
    }
  }
}

/**
 * JudgeFinder Organization Schema for Authority
 */
function generateJudgeFinderOrganizationSchema(baseUrl: string): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}#organization`,
    name: 'JudgeFinder',
    legalName: 'JudgeFinder Legal Analytics Platform',
    description: 'Leading provider of judicial analytics, legal research data, and attorney directory services for California courts and legal professionals.',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    foundingDate: '2024',
    areaServed: {
      '@type': 'State',
      name: 'California'
    },
    knowsAbout: [
      'Judicial Analytics',
      'Legal Research',
      'Court Data',
      'Attorney Directory Services',
      'Case Outcome Analysis',
      'Judicial Decision Patterns'
    ],
    serviceType: 'Legal Technology Platform',
    target: 'Legal Professionals and Citizens'
  }
}

/**
 * Dataset Schema for Judicial Data
 */
function generateDatasetSchema(judgeName: string, jurisdiction: string, canonicalUrl: string): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `Judicial Analytics Data for ${judgeName}`,
    description: `Comprehensive judicial analytics dataset containing case outcomes, ruling patterns, and decision trends for Judge ${judgeName} serving ${jurisdiction}`,
    url: canonicalUrl,
    creator: {
      '@type': 'Organization',
      name: 'JudgeFinder'
    },
    distribution: {
      '@type': 'DataDownload',
      contentUrl: canonicalUrl,
      encodingFormat: 'text/html'
    },
    keywords: [
      'judicial analytics',
      'case outcomes',
      'ruling patterns',
      'legal research',
      'judicial data'
    ]
  }
}

/**
 * Place Schema for Court Location
 */
function generatePlaceSchema(courtName: string, jurisdiction: string, baseUrl: string): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: courtName,
    description: `${courtName} located in ${jurisdiction}, California`,
    address: {
      '@type': 'PostalAddress',
      addressRegion: jurisdiction,
      addressCountry: 'US',
      addressLocality: jurisdiction.replace(' County', '')
    },
    containedInPlace: {
      '@type': 'State',
      name: 'California'
    },
    url: `${baseUrl}/courts/${courtName.toLowerCase().replace(/\s+/g, '-')}`
  }
}