export interface CourtInfo {
  id: string
  name: string
  type: string
  jurisdiction: string
  address?: string | number
  phone?: string
  website?: string
  judge_count: number
  slug?: string | null
}

export interface CourtsQueryResult {
  courts: CourtInfo[]
  total_count: number
  page: number
  per_page: number
  has_more: boolean
}

export interface JurisdictionMetadata {
  displayName: string
  jurisdictionValue: string
  description: string
}

