/**
 * Jurisdiction-specific content generation for California counties
 * Creates unique landing page content for each jurisdiction to improve SEO
 * and provide location-specific value to users
 */

export interface JurisdictionData {
  name: string
  slug: string
  population: number
  majorCities: string[]
  courtSystem: {
    superiorCourt: string
    districts: number
    specializations: string[]
  }
  legalLandscape: {
    majorPracticeAreas: string[]
    businessEnvironment: string
    notableLegalTrends: string[]
  }
  demographics: {
    economicProfile: string
    keyIndustries: string[]
    legalChallenges: string[]
  }
}

/**
 * Comprehensive California jurisdiction data for content generation
 */
export const CALIFORNIA_JURISDICTIONS: Record<string, JurisdictionData> = {
  'orange-county': {
    name: 'Orange County',
    slug: 'orange-county',
    population: 3186989,
    majorCities: ['Anaheim', 'Santa Ana', 'Irvine', 'Huntington Beach', 'Garden Grove', 'Newport Beach'],
    courtSystem: {
      superiorCourt: 'Superior Court of California, County of Orange',
      districts: 8,
      specializations: ['Business Law', 'Family Law', 'Real Estate', 'Employment Law']
    },
    legalLandscape: {
      majorPracticeAreas: ['Corporate Law', 'Real Estate Transactions', 'Family Law', 'Personal Injury', 'Employment Disputes'],
      businessEnvironment: 'Major business hub with Fortune 500 companies and technology sector growth',
      notableLegalTrends: ['Increased business litigation', 'Real estate development disputes', 'Technology contract negotiations']
    },
    demographics: {
      economicProfile: 'High-income suburban county with significant business activity',
      keyIndustries: ['Technology', 'Tourism', 'Real Estate', 'Healthcare', 'Finance'],
      legalChallenges: ['Housing affordability litigation', 'Business regulation compliance', 'Employment law complexity']
    }
  },
  'los-angeles-county': {
    name: 'Los Angeles County',
    slug: 'los-angeles-county', 
    population: 10014009,
    majorCities: ['Los Angeles', 'Long Beach', 'Glendale', 'Pasadena', 'Burbank', 'West Hollywood'],
    courtSystem: {
      superiorCourt: 'Superior Court of California, County of Los Angeles',
      districts: 23,
      specializations: ['Entertainment Law', 'Immigration', 'Criminal Law', 'Civil Rights']
    },
    legalLandscape: {
      majorPracticeAreas: ['Entertainment Law', 'Immigration Law', 'Criminal Defense', 'Civil Litigation', 'International Business'],
      businessEnvironment: 'Global business center with entertainment industry dominance and international trade',
      notableLegalTrends: ['Entertainment contract disputes', 'Immigration policy impacts', 'International business arbitration']
    },
    demographics: {
      economicProfile: 'Diverse economic base with significant wealth disparity and immigration population',
      keyIndustries: ['Entertainment', 'International Trade', 'Manufacturing', 'Tourism', 'Technology'],
      legalChallenges: ['Immigration law complexity', 'Entertainment industry disputes', 'Housing crisis litigation']
    }
  },
  'san-francisco-county': {
    name: 'San Francisco County',
    slug: 'san-francisco-county',
    population: 873965,
    majorCities: ['San Francisco'],
    courtSystem: {
      superiorCourt: 'Superior Court of California, City and County of San Francisco',
      districts: 1,
      specializations: ['Technology Law', 'Intellectual Property', 'Environmental Law', 'Securities']
    },
    legalLandscape: {
      majorPracticeAreas: ['Technology Law', 'Intellectual Property', 'Securities Law', 'Environmental Law', 'Real Estate'],
      businessEnvironment: 'Global technology hub with venture capital concentration and innovation focus',
      notableLegalTrends: ['AI and technology regulation', 'Intellectual property disputes', 'Environmental litigation']
    },
    demographics: {
      economicProfile: 'High-income technology-focused economy with significant wealth concentration',
      keyIndustries: ['Technology', 'Financial Services', 'Biotechnology', 'Tourism', 'Real Estate'],
      legalChallenges: ['Technology regulation', 'Housing crisis', 'Environmental compliance']
    }
  },
  'san-diego-county': {
    name: 'San Diego County',
    slug: 'san-diego-county',
    population: 3298634,
    majorCities: ['San Diego', 'Chula Vista', 'Oceanside', 'Escondido', 'Carlsbad', 'El Cajon'],
    courtSystem: {
      superiorCourt: 'Superior Court of California, County of San Diego',
      districts: 9,
      specializations: ['Immigration Law', 'Military Law', 'Cross-border Legal Issues', 'Maritime Law']
    },
    legalLandscape: {
      majorPracticeAreas: ['Immigration Law', 'Military Legal Affairs', 'International Trade', 'Biotechnology Law', 'Tourism Law'],
      businessEnvironment: 'Border economy with military presence, biotechnology sector, and international trade',
      notableLegalTrends: ['Immigration policy enforcement', 'Cross-border business disputes', 'Military legal matters']
    },
    demographics: {
      economicProfile: 'Military-influenced economy with growing biotechnology and tourism sectors',
      keyIndustries: ['Military', 'Biotechnology', 'Tourism', 'International Trade', 'Technology'],
      legalChallenges: ['Immigration enforcement', 'Border security issues', 'Military family legal needs']
    }
  },
  'sacramento-county': {
    name: 'Sacramento County',
    slug: 'sacramento-county',
    population: 1585055,
    majorCities: ['Sacramento', 'Elk Grove', 'Rancho Cordova', 'Citrus Heights', 'Folsom'],
    courtSystem: {
      superiorCourt: 'Superior Court of California, County of Sacramento',
      districts: 7,
      specializations: ['Administrative Law', 'Government Relations', 'Public Policy', 'Regulatory Law']
    },
    legalLandscape: {
      majorPracticeAreas: ['Government Law', 'Administrative Law', 'Public Policy', 'Regulatory Compliance', 'Employment Law'],
      businessEnvironment: 'State capital with government-centered economy and growing technology sector',
      notableLegalTrends: ['Government regulation development', 'Public policy litigation', 'Administrative law evolution']
    },
    demographics: {
      economicProfile: 'Government-centered economy with public sector employment dominance',
      keyIndustries: ['Government', 'Healthcare', 'Education', 'Technology', 'Agriculture'],
      legalChallenges: ['Government transparency', 'Public policy implementation', 'Regulatory compliance']
    }
  },
  'alameda-county': {
    name: 'Alameda County',
    slug: 'alameda-county',
    population: 1682353,
    majorCities: ['Oakland', 'Fremont', 'Berkeley', 'Hayward', 'Pleasanton', 'Dublin'],
    courtSystem: {
      superiorCourt: 'Superior Court of California, County of Alameda',
      districts: 12,
      specializations: ['Technology Law', 'Civil Rights', 'Environmental Law', 'Criminal Justice']
    },
    legalLandscape: {
      majorPracticeAreas: ['Technology Law', 'Civil Rights Law', 'Environmental Law', 'Criminal Defense', 'Business Law'],
      businessEnvironment: 'Bay Area technology extension with diverse economy and progressive policies',
      notableLegalTrends: ['Technology worker rights', 'Environmental justice', 'Criminal justice reform']
    },
    demographics: {
      economicProfile: 'Diverse economy mixing technology, port commerce, and urban challenges',
      keyIndustries: ['Technology', 'Port Commerce', 'Manufacturing', 'Education', 'Healthcare'],
      legalChallenges: ['Technology regulation', 'Environmental justice', 'Urban development disputes']
    }
  }
}

/**
 * Generate unique jurisdiction landing page content
 */
export function generateJurisdictionContent(jurisdictionSlug: string): {
  title: string
  description: string
  heroContent: string
  legalLandscapeContent: string
  courtSystemContent: string
  attorneyGuideContent: string
  keywords: string[]
} {
  const jurisdiction = CALIFORNIA_JURISDICTIONS[jurisdictionSlug]
  
  if (!jurisdiction) {
    return generateDefaultCaliforniaContent()
  }

  const { name, courtSystem, legalLandscape, demographics } = jurisdiction

  return {
    title: `${name} Judges Directory | Complete Judicial Profiles & Court Information`,
    description: `Research ${name} judges, court system, and legal professionals. Access comprehensive judicial analytics, court directories, and find experienced attorneys in ${name}.`,
    
    heroContent: `
      <h1>${name} Judicial Directory</h1>
      <p>Your comprehensive resource for researching judges, courts, and legal professionals throughout ${name}. 
      With ${jurisdiction.population.toLocaleString()} residents and ${courtSystem.districts} court districts, 
      ${name} maintains one of California's most significant judicial systems.</p>
      
      <p>Whether you're an attorney preparing for court, a litigant researching your judge, or a legal professional 
      seeking courthouse information, our platform provides essential judicial intelligence for ${name}'s legal community.</p>
    `,
    
    legalLandscapeContent: `
      <h2>${name} Legal Environment</h2>
      <p>${legalLandscape.businessEnvironment} The region's legal landscape is characterized by 
      ${legalLandscape.majorPracticeAreas.slice(0, 3).join(', ')}, and ${legalLandscape.majorPracticeAreas.slice(3).join(', ')}.</p>
      
      <p>Current legal trends in ${name} include ${legalLandscape.notableLegalTrends.join(', ')}. 
      These developments reflect the region's ${demographics.economicProfile.toLowerCase()} and the unique challenges 
      presented by ${demographics.keyIndustries.slice(0, 3).join(', ')} industries.</p>
      
      <h3>Major Practice Areas in ${name}</h3>
      <ul>
        ${legalLandscape.majorPracticeAreas.map(area => `<li>${area}</li>`).join('')}
      </ul>
    `,
    
    courtSystemContent: `
      <h2>${courtSystem.superiorCourt}</h2>
      <p>The ${courtSystem.superiorCourt} operates across ${courtSystem.districts} districts, 
      serving ${jurisdiction.majorCities.join(', ')}, and surrounding communities. 
      The court system specializes in ${courtSystem.specializations.join(', ')}, 
      reflecting the diverse legal needs of ${name}'s population.</p>
      
      <h3>Court Specializations</h3>
      <ul>
        ${courtSystem.specializations.map(spec => `<li>${spec}</li>`).join('')}
      </ul>
      
      <p>Judges in ${name} handle a diverse caseload reflecting the region's 
      ${demographics.keyIndustries.join(', ')} industries and unique legal challenges including 
      ${demographics.legalChallenges.join(', ')}.</p>
    `,
    
    attorneyGuideContent: `
      <h2>Finding Legal Representation in ${name}</h2>
      <p>When selecting an attorney in ${name}, consider their experience with local court procedures 
      and familiarity with judges throughout the ${courtSystem.districts}-district system. 
      Attorneys practicing in ${name} should understand the region's focus on 
      ${legalLandscape.majorPracticeAreas.slice(0, 2).join(' and ')} as well as emerging issues in 
      ${legalLandscape.notableLegalTrends[0]}.</p>
      
      <h3>Key Considerations for ${name} Legal Representation</h3>
      <ul>
        <li>Experience with ${courtSystem.superiorCourt} procedures</li>
        <li>Familiarity with ${name} judges and local court practices</li>
        <li>Understanding of ${demographics.keyIndustries[0]} and ${demographics.keyIndustries[1]} industry regulations</li>
        <li>Knowledge of current legal trends: ${legalLandscape.notableLegalTrends.slice(0, 2).join(' and ')}</li>
      </ul>
    `,
    
    keywords: generateJurisdictionKeywords(jurisdiction)
  }
}

/**
 * Generate comprehensive keywords for jurisdiction SEO
 */
function generateJurisdictionKeywords(jurisdiction: JurisdictionData): string[] {
  const keywords = new Set<string>()
  const { name, majorCities, courtSystem, legalLandscape, demographics } = jurisdiction
  
  // Primary location keywords
  keywords.add(`${name} judges`)
  keywords.add(`judges in ${name}`)
  keywords.add(`${name} court system`)
  keywords.add(`${name} courts`)
  keywords.add(`${name} legal directory`)
  keywords.add(`${name} attorney directory`)
  keywords.add(`${name} lawyers`)
  keywords.add(`find attorneys ${name}`)
  
  // Court-specific keywords
  keywords.add(courtSystem.superiorCourt)
  keywords.add(`${courtSystem.superiorCourt} judges`)
  keywords.add(`superior court ${name}`)
  
  // City-specific variations
  majorCities.forEach(city => {
    keywords.add(`${city} judges`)
    keywords.add(`${city} courts`)
    keywords.add(`${city} attorneys`)
    keywords.add(`lawyers in ${city}`)
    keywords.add(`${city} legal services`)
  })
  
  // Practice area keywords
  legalLandscape.majorPracticeAreas.forEach(area => {
    keywords.add(`${area} ${name}`)
    keywords.add(`${area} attorneys ${name}`)
    keywords.add(`${area} lawyers ${name}`)
    keywords.add(`${name} ${area}`)
  })
  
  // Court specialization keywords
  courtSystem.specializations.forEach(spec => {
    keywords.add(`${spec} ${name}`)
    keywords.add(`${spec} court ${name}`)
    keywords.add(`${spec} judges ${name}`)
  })
  
  // Industry-specific legal terms
  demographics.keyIndustries.forEach(industry => {
    keywords.add(`${industry} law ${name}`)
    keywords.add(`${industry} attorneys ${name}`)
    keywords.add(`${industry} legal services ${name}`)
  })
  
  // Legal trend keywords
  legalLandscape.notableLegalTrends.forEach(trend => {
    keywords.add(`${trend} ${name}`)
    keywords.add(`${name} ${trend}`)
  })
  
  // General legal service keywords
  const generalTerms = [
    'judicial research', 'legal analytics', 'court information', 'judge lookup',
    'legal intelligence', 'court directory', 'judicial profiles', 'legal research',
    'attorney finder', 'lawyer directory', 'legal professionals', 'court records'
  ]
  
  generalTerms.forEach(term => {
    keywords.add(`${term} ${name}`)
    keywords.add(`${name} ${term}`)
  })
  
  return Array.from(keywords)
}

/**
 * Generate default California content for unknown jurisdictions
 */
function generateDefaultCaliforniaContent() {
  return {
    title: 'California Judges Directory | Statewide Judicial Profiles & Court Information',
    description: 'Research California judges, court systems, and legal professionals across all 58 counties. Access comprehensive judicial analytics and find experienced attorneys statewide.',
    heroContent: `
      <h1>California Judicial Directory</h1>
      <p>Your comprehensive resource for researching judges, courts, and legal professionals throughout California. 
      With 58 counties and hundreds of court districts, California maintains the nation's largest state judicial system.</p>
      
      <p>Whether you're an attorney, litigant, or legal professional, our platform provides essential judicial intelligence 
      for California's diverse legal community across all jurisdictions.</p>
    `,
    legalLandscapeContent: `
      <h2>California Legal Environment</h2>
      <p>California's legal landscape encompasses diverse practice areas including technology law, entertainment law, 
      immigration law, environmental law, and business litigation. The state's innovative economy drives unique legal challenges 
      across sectors from Silicon Valley technology to Hollywood entertainment.</p>
    `,
    courtSystemContent: `
      <h2>California Superior Court System</h2>
      <p>California's superior courts operate across 58 counties, each with specialized departments and unique jurisdictional focus. 
      The unified court system handles millions of cases annually across civil, criminal, family, and appellate matters.</p>
    `,
    attorneyGuideContent: `
      <h2>Finding Legal Representation in California</h2>
      <p>When selecting an attorney in California, consider their experience with specific county court procedures and 
      familiarity with local judicial practices. California's diverse legal landscape requires specialized knowledge 
      across multiple practice areas and jurisdictions.</p>
    `,
    keywords: [
      'California judges', 'California courts', 'CA judicial directory', 'California attorneys',
      'California legal system', 'superior court California', 'California lawyer directory',
      'California court system', 'judges in California', 'California legal professionals'
    ]
  }
}

/**
 * Get all available jurisdiction slugs
 */
export function getAvailableJurisdictions(): string[] {
  return Object.keys(CALIFORNIA_JURISDICTIONS)
}

/**
 * Check if jurisdiction slug is valid
 */
export function isValidJurisdiction(slug: string): boolean {
  return slug in CALIFORNIA_JURISDICTIONS
}