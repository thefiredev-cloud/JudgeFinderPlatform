import { sleep } from '@/lib/utils/helpers'

interface CourtListenerOpinion {
  id: number
  cluster: number
  date_filed: string
  case_name: string
  case_number?: string
  court: {
    id: string
    name: string
  }
  cluster_obj?: {
    case_name: string
    date_filed: string
    citation_count: number
    disposition: string
  }
}

interface CourtListenerResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export class CourtListenerClient {
  private baseUrl = 'https://www.courtlistener.com/api/rest/v4'
  private apiToken: string
  private requestDelay = 1000 // 1 second between requests to respect rate limits

  constructor() {
    this.apiToken = process.env.COURTLISTENER_API_KEY || process.env.COURTLISTENER_API_TOKEN || ''
    if (!this.apiToken) {
      throw new Error('COURTLISTENER_API_KEY or COURTLISTENER_API_TOKEN environment variable is required')
    }
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    // Add API token to params
    params.format = 'json'
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value)
    })

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'JudgeFinder/1.0 (https://judgefinder.com; contact@judgefinder.com)'
    }

    // Add authorization header
    if (this.apiToken) {
      headers['Authorization'] = `Token ${this.apiToken}`
    }

    try {
      console.log(`Making request to: ${url.toString()}`)
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`CourtListener API error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      
      // Add delay to respect rate limits
      await sleep(this.requestDelay)
      
      return data
    } catch (error) {
      console.error('CourtListener API request failed:', error)
      throw error
    }
  }

  /**
   * Search for opinions by judge
   */
  async getOpinionsByJudge(
    judgeId: string,
    options: {
      startDate?: string // YYYY-MM-DD format
      endDate?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<CourtListenerResponse<CourtListenerOpinion>> {
    const params: Record<string, string> = {
      author: judgeId,
      ordering: '-date_created' // Most recent first by creation date
    }

    if (options.startDate) params.cluster__date_filed__gte = options.startDate
    if (options.endDate) params.cluster__date_filed__lte = options.endDate
    if (options.limit) params.page_size = options.limit.toString()
    if (options.offset) params.offset = options.offset.toString()

    return this.makeRequest<CourtListenerResponse<CourtListenerOpinion>>('/opinions/', params)
  }

  /**
   * Get recent opinions for a judge (last 3 years) with cluster details
   */
  async getRecentOpinionsByJudge(judgeId: string, yearsBack: number = 3): Promise<any[]> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setFullYear(endDate.getFullYear() - yearsBack)

    const allCases: any[] = []
    let offset = 0
    const pageSize = 50
    let hasMore = true

    while (hasMore && allCases.length < 200) { // Limit to 200 cases per judge
      try {
        const response = await this.getOpinionsByJudge(judgeId, {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          limit: pageSize,
          offset
        })

        // For each opinion, fetch the cluster details
        for (const opinion of response.results) {
          if (opinion.cluster) {
            try {
              const cluster = await this.getClusterDetails(opinion.cluster)
              
              // Combine opinion and cluster data
              const caseData = {
                opinion_id: opinion.id,
                cluster_id: opinion.cluster,
                case_name: cluster.case_name || 'Unknown Case',
                date_filed: cluster.date_filed,
                precedential_status: cluster.precedential_status,
                author_id: null, // Not available in opinion object
                author_str: null, // Not available in opinion object
                date_created: opinion.date_filed // Use date_filed instead
              }
              
              allCases.push(caseData)
            } catch (clusterError) {
              console.error(`Error fetching cluster ${opinion.cluster}:`, clusterError)
              // Add opinion without cluster details
              allCases.push({
                opinion_id: opinion.id,
                cluster_id: opinion.cluster,
                case_name: 'Unknown Case',
                date_filed: null,
                author_id: null, // Not available in opinion object
                author_str: null, // Not available in opinion object
                date_created: opinion.date_filed // Use date_filed instead
              })
            }
          }
        }
        
        // Check if there are more results
        hasMore = response.next !== null && response.results.length === pageSize
        offset += pageSize

        console.log(`  Fetched ${response.results.length} opinions, total cases: ${allCases.length}`)
        
      } catch (error) {
        console.error(`Error fetching opinions for judge ${judgeId} at offset ${offset}:`, error)
        break
      }
    }

    return allCases
  }

  /**
   * Get cluster details for a specific cluster ID
   */
  async getClusterDetails(clusterId: string | number): Promise<any> {
    return this.makeRequest(`/clusters/${clusterId}/`)
  }

  /**
   * Transform CourtListener case data to our case format
   */
  transformOpinionToCase(caseData: any, judgeId: string) {
    const caseName = caseData.case_name || 'Unknown Case'
    const decisionDate = caseData.date_filed
    
    return {
      judge_id: judgeId,
      case_name: caseName.substring(0, 500), // Truncate if too long
      case_number: `CL-O${caseData.opinion_id}`,
      decision_date: decisionDate,
      case_type: 'Opinion',
      status: 'decided' as const,
      outcome: caseData.precedential_status || null,
      summary: `CourtListener opinion ${caseData.opinion_id}`,
      courtlistener_id: `opinion_${caseData.opinion_id}`,
      filing_date: decisionDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  /**
   * Validate judge has CourtListener data
   */
  async validateJudge(judgeId: string): Promise<boolean> {
    try {
      const response = await this.getOpinionsByJudge(judgeId, { limit: 1 })
      return response.count > 0
    } catch (error) {
      console.error(`Error validating judge ${judgeId}:`, error)
      return false
    }
  }
}

// Helper function to create rate-limited requests
export async function withRateLimit<T>(
  requests: (() => Promise<T>)[],
  delayMs: number = 1000
): Promise<T[]> {
  const results: T[] = []
  
  for (const request of requests) {
    try {
      const result = await request()
      results.push(result)
      
      if (requests.indexOf(request) < requests.length - 1) {
        await sleep(delayMs)
      }
    } catch (error) {
      console.error('Rate-limited request failed:', error)
      throw error
    }
  }
  
  return results
}