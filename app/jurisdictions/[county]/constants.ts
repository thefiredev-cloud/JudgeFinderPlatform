import { JurisdictionMetadata } from './types'

export const jurisdictionMap: Record<string, JurisdictionMetadata> = {
  'los-angeles-county': {
    displayName: 'Los Angeles County',
    jurisdictionValue: 'CA',
    description: 'Largest judicial system in California with comprehensive trial and appellate courts.'
  },
  'orange-county': {
    displayName: 'Orange County',
    jurisdictionValue: 'Orange County, CA',
    description: 'Major Southern California jurisdiction serving diverse communities and businesses.'
  },
  'san-diego-county': {
    displayName: 'San Diego County',
    jurisdictionValue: 'CA',
    description: 'Southern California coastal jurisdiction with federal and state court systems.'
  },
  'san-francisco-county': {
    displayName: 'San Francisco County',
    jurisdictionValue: 'CA',
    description: 'Metropolitan jurisdiction with specialized business and technology courts.'
  },
  'santa-clara-county': {
    displayName: 'Santa Clara County',
    jurisdictionValue: 'CA',
    description: 'Silicon Valley jurisdiction handling technology and intellectual property cases.'
  },
  'alameda-county': {
    displayName: 'Alameda County',
    jurisdictionValue: 'CA',
    description: 'Bay Area jurisdiction with diverse civil and criminal caseloads.'
  },
  california: {
    displayName: 'California',
    jurisdictionValue: 'CA',
    description: 'State courts across California handling various civil and criminal matters.'
  },
  federal: {
    displayName: 'Federal',
    jurisdictionValue: 'F',
    description: 'Federal courts handling federal matters across California districts.'
  },
  texas: {
    displayName: 'Texas',
    jurisdictionValue: 'TX',
    description: 'Texas state courts and federal courts in Texas jurisdictions.'
  }
}

