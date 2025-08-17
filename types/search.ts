export type SearchResultType = 'judge' | 'court' | 'jurisdiction'

export interface BaseSearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle?: string
  description?: string
  url: string
  relevanceScore?: number
}

export interface JudgeSearchResult extends BaseSearchResult {
  type: 'judge'
  court_name?: string
  jurisdiction?: string
  total_cases?: number
  profile_image_url?: string
}

export interface CourtSearchResult extends BaseSearchResult {
  type: 'court'
  court_type?: string
  jurisdiction?: string
  address?: string
  judge_count?: number
  phone?: string
  website?: string
}

export interface JurisdictionSearchResult extends BaseSearchResult {
  type: 'jurisdiction'
  jurisdictionValue: string
  displayName: string
  description: string
  court_count?: number
  judge_count?: number
}

export type SearchResult = JudgeSearchResult | CourtSearchResult | JurisdictionSearchResult

export interface SearchResponse {
  results: SearchResult[]
  total_count: number
  results_by_type: {
    judges: JudgeSearchResult[]
    courts: CourtSearchResult[]
    jurisdictions: JurisdictionSearchResult[]
  }
  counts_by_type: {
    judges: number
    courts: number
    jurisdictions: number
  }
  query: string
  took_ms: number
}

export interface SearchSuggestion {
  text: string
  type: SearchResultType
  count: number
  url: string
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[]
  query: string
}

// Predefined jurisdictions for search
export const PREDEFINED_JURISDICTIONS: JurisdictionSearchResult[] = [
  {
    id: 'ca',
    type: 'jurisdiction',
    title: 'California',
    subtitle: 'State Courts',
    description: 'State courts across California handling various civil and criminal matters.',
    url: '/jurisdictions/california',
    jurisdictionValue: 'CA',
    displayName: 'California'
  },
  {
    id: 'federal',
    type: 'jurisdiction', 
    title: 'Federal',
    subtitle: 'Federal Courts',
    description: 'Federal courts handling federal matters across California districts.',
    url: '/jurisdictions/federal',
    jurisdictionValue: 'F',
    displayName: 'Federal'
  },
  {
    id: 'los-angeles-county',
    type: 'jurisdiction',
    title: 'Los Angeles County',
    subtitle: 'County Courts',
    description: 'Largest judicial system in California with comprehensive trial and appellate courts.',
    url: '/jurisdictions/los-angeles-county',
    jurisdictionValue: 'CA',
    displayName: 'Los Angeles County'
  },
  {
    id: 'orange-county',
    type: 'jurisdiction',
    title: 'Orange County',
    subtitle: 'County Courts',
    description: 'Major Southern California jurisdiction serving diverse communities and businesses.',
    url: '/jurisdictions/orange-county',
    jurisdictionValue: 'Orange County, CA',
    displayName: 'Orange County'
  },
  {
    id: 'san-diego-county',
    type: 'jurisdiction',
    title: 'San Diego County',
    subtitle: 'County Courts',
    description: 'Southern California coastal jurisdiction with federal and state court systems.',
    url: '/jurisdictions/san-diego-county',
    jurisdictionValue: 'CA',
    displayName: 'San Diego County'
  },
  {
    id: 'san-francisco-county',
    type: 'jurisdiction',
    title: 'San Francisco County',
    subtitle: 'County Courts',
    description: 'Metropolitan jurisdiction with specialized business and technology courts.',
    url: '/jurisdictions/san-francisco-county',
    jurisdictionValue: 'CA',
    displayName: 'San Francisco County'
  },
  {
    id: 'santa-clara-county',
    type: 'jurisdiction',
    title: 'Santa Clara County',
    subtitle: 'County Courts',
    description: 'Silicon Valley jurisdiction handling technology and intellectual property cases.',
    url: '/jurisdictions/santa-clara-county',
    jurisdictionValue: 'CA',
    displayName: 'Santa Clara County'
  },
  {
    id: 'alameda-county',
    type: 'jurisdiction',
    title: 'Alameda County',
    subtitle: 'County Courts',
    description: 'Bay Area jurisdiction with diverse civil and criminal caseloads.',
    url: '/jurisdictions/alameda-county',
    jurisdictionValue: 'CA',
    displayName: 'Alameda County'
  }
]