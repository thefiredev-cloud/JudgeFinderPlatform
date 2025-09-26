import { sleep } from '@/lib/utils/helpers'

export interface CourtListenerOpinion {
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

export interface CourtListenerDocket {
  id: number
  absolute_url?: string
  case_name: string
  case_name_short?: string | null
  docket_number?: string | null
  court_id?: string | null
  court?: string | null
  date_filed?: string | null
  date_terminated?: string | null
  date_last_filing?: string | null
  jurisdiction_type?: string | null
  nature_of_suit?: string | null
  assigned_to_str?: string | null
  assigned_to_id?: string | null
  pacer_case_id?: string | null
  status?: string | null
  docket_entries_count?: number | null
}

export interface CourtListenerJudge {
  id: string | number
  name: string
  name_full?: string
  positions?: any[]
  educations?: any[]
  date_created?: string
  date_modified?: string
  fjc_id?: string
  cl_id?: string
  [key: string]: any
}

export interface CourtListenerCourt {
  id: string
  name: string
  full_name: string
  jurisdiction: string
  url?: string
  position?: string
  date_created?: string
  date_modified?: string
  short_name?: string
  citation_string?: string
  in_use?: boolean
  has_opinion_scraper?: boolean
  has_oral_argument_scraper?: boolean
  position_count?: number
  start_date?: string
  end_date?: string
  location?: string
  [key: string]: any
}

interface CourtListenerResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

interface RequestOptions {
  allow404?: boolean
}

export class CourtListenerClient {
  private baseUrl = 'https://www.courtlistener.com/api/rest/v4'
  private apiToken: string
  private requestDelay = Math.max(250, parseInt(process.env.COURTLISTENER_REQUEST_DELAY_MS || '1000', 10))
  private maxRetries = Math.max(0, parseInt(process.env.COURTLISTENER_MAX_RETRIES || '5', 10))
  private requestTimeoutMs = Math.max(5000, parseInt(process.env.COURTLISTENER_REQUEST_TIMEOUT_MS || '30000', 10))
  private backoffCapMs = Math.max(2000, parseInt(process.env.COURTLISTENER_BACKOFF_CAP_MS || '15000', 10))
  private retryJitterMaxMs = Math.max(1000, parseInt(process.env.COURTLISTENER_RETRY_JITTER_MAX_MS || '500', 10))
  private circuitOpenUntil = 0
  private circuitFailures = 0
  private circuitThreshold = Math.max(3, parseInt(process.env.COURTLISTENER_CIRCUIT_THRESHOLD || '5', 10))
  private circuitCooldownMs = Math.max(10000, parseInt(process.env.COURTLISTENER_CIRCUIT_COOLDOWN_MS || '60000', 10))
  private metricsReporter?: (name: string, value: number, meta?: Record<string, any>) => void | Promise<void>

  constructor() {
    this.apiToken = process.env.COURTLISTENER_API_KEY || process.env.COURTLISTENER_API_TOKEN || ''
    if (!this.apiToken) {
      throw new Error('COURTLISTENER_API_KEY or COURTLISTENER_API_TOKEN environment variable is required')
    }
  }

  setMetricsReporter(reporter: (name: string, value: number, meta?: Record<string, any>) => void | Promise<void>) {
    this.metricsReporter = reporter
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}, options: RequestOptions = {}): Promise<T> {
    // Circuit breaker: short-circuit requests during cooldown window
    const now = Date.now()
    if (now < this.circuitOpenUntil) {
      const waitMs = this.circuitOpenUntil - now
      const err = new Error(`CourtListener circuit open, retry after ${waitMs}ms`)
      try { await this.metricsReporter?.('courtlistener_circuit_shortcircuit', 1, { waitMs }) } catch {}
      throw err
    }

    const isAbsolute = endpoint.startsWith('http')
    const url = new URL(isAbsolute ? endpoint : `${this.baseUrl}${endpoint}`)

    if (!isAbsolute) {
      params.format = params.format || 'json'
    } else if (!url.searchParams.has('format')) {
      url.searchParams.append('format', 'json')
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (url.searchParams.has(key)) {
          url.searchParams.set(key, value)
        } else {
          url.searchParams.append(key, value)
        }
      }
    })

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'JudgeFinder/1.0 (https://judgefinder.com; contact@judgefinder.com)'
    }

    // Add authorization header
    if (this.apiToken) {
      headers['Authorization'] = `Token ${this.apiToken}`
    }

    // Exponential backoff with jitter
    const maxRetries = this.maxRetries
    let attempt = 0
    let lastError: any = null
    let lastStatus: number | undefined
    let lastRetryAfterMs: number | null = null

    while (attempt <= maxRetries) {
      try {
        console.log(`Making request to: ${url.toString()} (attempt ${attempt + 1}/${maxRetries + 1})`)
        const controller = new AbortController()
        const timeoutMs = this.requestTimeoutMs
        const timeout = setTimeout(() => controller.abort(), timeoutMs)

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers,
          signal: controller.signal
        })
        clearTimeout(timeout)

        if (!response.ok) {
          const status = response.status
          const errorText = await response.text().catch(() => '')
          lastStatus = status
          lastRetryAfterMs = this.parseRetryAfter(response.headers.get('retry-after'))

          // Handle 429/5xx with retry
          if (status === 429 || (status >= 500 && status < 600)) {
            lastError = new Error(`CourtListener API error ${status}: ${errorText}`)
          } else if (status === 404 && options.allow404) {
            try { await this.metricsReporter?.('courtlistener_404', 1, { url: url.pathname }) } catch {}
            return null as unknown as T
          } else {
            throw new Error(`CourtListener API error ${status}: ${errorText}`)
          }
        } else {
          const data = await response.json()
          await sleep(this.requestDelay)
          // reset failure counter on success
          this.circuitFailures = 0
          lastStatus = undefined
          lastRetryAfterMs = null
          return data
        }
      } catch (error) {
        lastError = error
        lastStatus = undefined
        lastRetryAfterMs = null
        // AbortError or network error should retry
      }

      // Backoff before next attempt
      attempt += 1
      if (attempt > maxRetries) break
      const backoff = this.computeBackoffDelay(attempt, lastStatus, lastRetryAfterMs)
      console.warn(`CourtListener backoff attempt ${attempt}/${maxRetries} for ${backoff}ms (status=${lastStatus ?? 'n/a'})`)
      try { await this.metricsReporter?.('courtlistener_retry', 1, { attempt, status: lastStatus, delayMs: backoff }) } catch {}
      await sleep(backoff)
    }

    // open circuit
    this.circuitFailures += 1
    if (this.circuitFailures >= this.circuitThreshold) {
      this.circuitOpenUntil = Date.now() + this.circuitCooldownMs
      console.warn(`CourtListener circuit opened for ${this.circuitCooldownMs}ms after ${this.circuitFailures} failures`)
      try { await this.metricsReporter?.('courtlistener_circuit_open', 1, { cooldownMs: this.circuitCooldownMs }) } catch {}
      this.circuitFailures = 0
    }

    console.error('CourtListener API request failed after retries:', lastError)
    throw lastError || new Error('CourtListener API request failed')
  }

  private computeBackoffDelay(attempt: number, lastStatus?: number, retryAfterMs: number | null = null): number {
    if (retryAfterMs && retryAfterMs > 0) {
      return retryAfterMs
    }

    const exponent = Math.min(attempt, 6)
    const base = Math.min(1000 * 2 ** exponent, this.backoffCapMs)
    const jitterUpperBound = this.retryJitterMaxMs
    const jitter = Math.floor(Math.random() * jitterUpperBound)

    if (lastStatus === 429) {
      const throttledBase = Math.max(base * 1.5, base + 1000)
      return Math.min(throttledBase + jitter, this.backoffCapMs + jitterUpperBound)
    }

    if (lastStatus && lastStatus >= 500 && lastStatus < 600) {
      const serverBase = Math.max(base * 1.25, base + 500)
      return Math.min(serverBase + jitter, this.backoffCapMs + jitterUpperBound)
    }

    return Math.min(base + jitter, this.backoffCapMs + jitterUpperBound)
  }

  private parseRetryAfter(headerValue: string | null): number | null {
    if (!headerValue) {
      return null
    }

    const numericValue = Number(headerValue)
    if (Number.isFinite(numericValue)) {
      return Math.max(0, numericValue * 1000)
    }

    const retryDate = new Date(headerValue)
    if (!Number.isNaN(retryDate.getTime())) {
      const delayMs = retryDate.getTime() - Date.now()
      return delayMs > 0 ? delayMs : null
    }

    return null
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
                id: opinion.id,
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
                id: opinion.id,
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
   * Search for dockets (court filings) by judge identifier
   */
  async getDocketsByJudge(
    judgeId: string,
    options: {
      startDate?: string
      endDate?: string
      limit?: number
      offset?: number
      ordering?: string
    } = {}
  ): Promise<CourtListenerResponse<CourtListenerDocket>> {
    const params: Record<string, string> = {
      assigned_to_id: judgeId,
      ordering: options.ordering || '-date_filed'
    }

    if (options.startDate) params.date_filed__gte = options.startDate
    if (options.endDate) params.date_filed__lte = options.endDate
    if (options.limit) params.page_size = options.limit.toString()
    if (options.offset) params.offset = options.offset.toString()

    return this.makeRequest<CourtListenerResponse<CourtListenerDocket>>('/dockets/', params)
  }

  /**
   * Fetch recent court filings (dockets) for a judge with pagination handling
   */
  async getRecentDocketsByJudge(
    judgeId: string,
    options: {
      yearsBack?: number
      maxRecords?: number
      startDate?: string
      endDate?: string
    } = {}
  ): Promise<CourtListenerDocket[]> {
    const endDate = options.endDate ? new Date(options.endDate) : new Date()
    const startDate = options.startDate
      ? new Date(options.startDate)
      : (() => {
          const d = new Date(endDate)
          d.setFullYear(d.getFullYear() - (options.yearsBack ?? 5))
          return d
        })()

    const formattedStart = startDate.toISOString().split('T')[0]
    const formattedEnd = endDate.toISOString().split('T')[0]

    const allDockets: CourtListenerDocket[] = []
    let offset = 0
    const pageSize = 50
    const maxRecords = options.maxRecords ?? 300
    let hasMore = true

    while (hasMore && allDockets.length < maxRecords) {
      try {
        const response = await this.getDocketsByJudge(judgeId, {
          startDate: formattedStart,
          endDate: formattedEnd,
          limit: pageSize,
          offset,
          ordering: '-date_filed'
        })

        allDockets.push(...response.results)

        hasMore = Boolean(response.next) && response.results.length === pageSize
        offset += pageSize

      } catch (error) {
        console.error(`Error fetching dockets for judge ${judgeId} at offset ${offset}:`, error)
        break
      }

      if (allDockets.length >= maxRecords) {
        break
      }
    }

    return allDockets.slice(0, maxRecords)
  }

  /**
   * Get cluster details for a specific cluster ID
   */
  async getClusterDetails(clusterId: string | number): Promise<any> {
    return this.makeRequest(`/clusters/${clusterId}/`)
  }

  /**
   * Get full opinion detail including plain text
   */
  async getOpinionDetail(opinionId: string | number): Promise<any> {
    return this.makeRequest(`/opinions/${opinionId}/`)
  }

  /**
   * Fetch a specific judge by CourtListener ID
   */
  async getJudgeById(judgeId: string): Promise<CourtListenerJudge | null> {
    return this.makeRequest(`/people/${judgeId}/`, {}, { allow404: true })
  }

  /**
   * List judges (CourtListener people endpoint) with optional filters and pagination support
   */
  async listJudges(options: {
    pageSize?: number
    ordering?: string
    cursorUrl?: string | null
    filters?: Record<string, string>
  } = {}): Promise<CourtListenerResponse<CourtListenerJudge>> {
    const { pageSize = 100, ordering = '-date_modified', cursorUrl, filters = {} } = options

    const response = await this.makeRequest<CourtListenerResponse<CourtListenerJudge>>(
      cursorUrl ?? '/people/',
      cursorUrl ? {} : { page_size: pageSize.toString(), ordering, ...filters }
    )

    return {
      ...response,
      next: response.next ? new URL(response.next, this.baseUrl).toString() : null,
      previous: response.previous ? new URL(response.previous, this.baseUrl).toString() : null
    }
  }

  /**
   * List courts with optional pagination
   */
  async listCourts(options: {
    pageSize?: number
    ordering?: string
    cursorUrl?: string | null
  } = {}): Promise<CourtListenerResponse<CourtListenerCourt>> {
    const { pageSize = 100, ordering = '-date_modified', cursorUrl } = options

    const response = await this.makeRequest<CourtListenerResponse<CourtListenerCourt>>(
      cursorUrl ?? '/courts/',
      cursorUrl ? {} : { page_size: pageSize.toString(), ordering }
    )

    return {
      ...response,
      next: response.next ? new URL(response.next, this.baseUrl).toString() : null,
      previous: response.previous ? new URL(response.previous, this.baseUrl).toString() : null
    }
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
