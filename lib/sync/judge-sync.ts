/**
 * Judge Data Synchronization Module
 * Handles automated syncing of judge data from CourtListener API
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CourtListenerClient } from '@/lib/courtlistener/client'
import { logger } from '@/lib/utils/logger'
import { sleep } from '@/lib/utils/helpers'
import { normalizeJurisdiction } from '@/lib/sync/normalization'

interface JudgeSyncOptions {
  batchSize?: number
  jurisdiction?: string
  forceRefresh?: boolean
  judgeIds?: string[] // Specific judges to sync
  /**
   * Maximum number of new CourtListener judge IDs to discover per run.
   * Keep modest (e.g., 200–1000) for serverless time limits; a driving script can loop.
   */
  discoverLimit?: number
}

interface JudgeSyncResult {
  success: boolean
  judgesProcessed: number
  judgesUpdated: number
  judgesCreated: number
  profilesEnhanced: number
  errors: string[]
  duration: number
}

interface CourtListenerJudge {
  id: string
  name: string
  name_full?: string
  positions?: any[]
  educations?: any[]
  date_created?: string
  date_modified?: string
  fjc_id?: string
  cl_id?: string
}

interface BatchSyncStats {
  processed: number
  updated: number
  created: number
  enhanced: number
  errors: string[]
}

export class JudgeSyncManager {
  private supabase: SupabaseClient
  private courtListener: CourtListenerClient
  private syncId: string

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase credentials missing: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    })
    this.courtListener = new CourtListenerClient()
    this.courtListener.setMetricsReporter(async (name, value, meta) => {
      try {
        await this.supabase.from('performance_metrics').insert({
          metric_name: name,
          metric_value: value,
          page_url: '/lib/sync/judge-sync',
          page_type: 'sync',
          metric_id: name,
          rating: 'needs-improvement',
          metadata: meta || null
        })
      } catch (_) {}
    })
    this.syncId = `judge-sync-${Date.now()}`
  }

  /**
   * Main judge sync function
   */
  async syncJudges(options: JudgeSyncOptions = {}): Promise<JudgeSyncResult> {
    const startTime = Date.now()
    const result: JudgeSyncResult = {
      success: false,
      judgesProcessed: 0,
      judgesUpdated: 0,
      judgesCreated: 0,
      profilesEnhanced: 0,
      errors: [],
      duration: 0
    }

    try {
      logger.info('Starting judge data sync', { syncId: this.syncId, options })

      await this.logSyncStart('judge', options)

      // Determine sync strategy
      if (options.judgeIds && options.judgeIds.length > 0) {
        const stats = await this.syncSpecificJudges(options.judgeIds, options)
        this.mergeStats(result, stats)
      } else {
        const stats = await this.syncAllJudges(options)
        this.mergeStats(result, stats)
      }

      result.duration = Date.now() - startTime
      result.success = result.errors.length === 0

      await this.logSyncCompletion('judge', result)

      logger.info('Judge sync completed', { 
        syncId: this.syncId, 
        result: {
          ...result,
          errors: result.errors.length
        }
      })

      return result

    } catch (error) {
      result.duration = Date.now() - startTime
      result.success = false
      result.errors.push(`Sync failed: ${error}`)

      logger.error('Judge sync failed', { syncId: this.syncId, error })
      await this.logSyncError('judge', error as Error)
      
      return result
    }
  }

  /**
   * Sync specific judges by their IDs
   */
  private async syncSpecificJudges(
    judgeIds: string[], 
    options: JudgeSyncOptions
  ): Promise<BatchSyncStats> {
    const stats: BatchSyncStats = {
      processed: 0,
      updated: 0,
      created: 0,
      enhanced: 0,
      errors: []
    }

    const batchSize = options.batchSize || 10

    for (let i = 0; i < judgeIds.length; i += batchSize) {
      const batch = judgeIds.slice(i, i + batchSize)
      
      try {
        for (const judgeId of batch) {
          const processed = await this.syncSingleJudge(judgeId, options)
          if (processed.updated) stats.updated++
          if (processed.created) stats.created++
          if (processed.enhanced) stats.enhanced++
          stats.processed++
        }
      } catch (error) {
        const details = error instanceof Error ? error.message : String(error)
        stats.errors.push(`Batch processing failed: ${details}`)
      }

      // Rate limiting
      if (i + batchSize < judgeIds.length) {
        await sleep(1000)
      }
    }

    return stats
  }

  /**
   * Sync all judges (with jurisdiction filter)
   */
  private async syncAllJudges(options: JudgeSyncOptions): Promise<BatchSyncStats> {
    const stats: BatchSyncStats = {
      processed: 0,
      updated: 0,
      created: 0,
      enhanced: 0,
      errors: []
    }

    // Get judges from our database that need updating
    const judgesToSync = await this.getJudgesNeedingUpdate(options)

    if (judgesToSync.length > 0) {
      const batchSize = options.batchSize || 10

      for (let i = 0; i < judgesToSync.length; i += batchSize) {
        const batch = judgesToSync.slice(i, i + batchSize)
        
        try {
          const batchResult = await this.processBatch(batch, options)
          stats.processed += batchResult.processed
          stats.updated += batchResult.updated
          stats.created += batchResult.created
          stats.enhanced += batchResult.enhanced
          stats.errors.push(...batchResult.errors)
        } catch (error) {
          const details = error instanceof Error ? error.message : String(error)
          stats.errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${details}`)
        }

        // Rate limiting
        if (i + batchSize < judgesToSync.length) {
          await sleep(2000)
        }
      }
    }

    // Discover and import new judges that are not yet in our database
    const newJudgeIds = await this.discoverNewJudgeIds(options)

    if (newJudgeIds.length > 0) {
      logger.info('Discovered new judges to import', { count: newJudgeIds.length })
      const newJudgeStats = await this.syncSpecificJudges(newJudgeIds, options)
      stats.processed += newJudgeStats.processed
      stats.updated += newJudgeStats.updated
      stats.created += newJudgeStats.created
      stats.enhanced += newJudgeStats.enhanced
      stats.errors.push(...newJudgeStats.errors)
    }

    return stats
  }

  /**
   * Get judges that need updating
   */
  private async getJudgesNeedingUpdate(options: JudgeSyncOptions) {
    let query = this.supabase
      .from('judges')
      .select('id, name, courtlistener_id, updated_at')
      .not('courtlistener_id', 'is', null)

    if (options.jurisdiction) {
      query = query.eq('jurisdiction', options.jurisdiction)
    }

    // Get judges that haven't been updated in 7 days
    if (!options.forceRefresh) {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      query = query.lt('updated_at', weekAgo.toISOString())
    }

    const { data, error } = await query.limit(100) // Limit to prevent overwhelming

    if (error) {
      throw new Error(`Failed to get judges needing update: ${error.message}`)
    }

    return data || []
  }

  /**
   * Process a batch of judges
   */
  private async processBatch(judges: any[], options: JudgeSyncOptions): Promise<BatchSyncStats> {
    const stats: BatchSyncStats = {
      processed: 0,
      updated: 0,
      created: 0,
      enhanced: 0,
      errors: []
    }

    for (const judge of judges) {
      try {
        const result = await this.syncSingleJudge(judge.courtlistener_id, options)
        if (result.updated) stats.updated++
        if (result.created) stats.created++
        if (result.enhanced) stats.enhanced++
        stats.processed++
      } catch (error) {
        const details = error instanceof Error ? error.message : String(error)
        stats.errors.push(`Failed to sync judge ${judge.name}: ${details}`)
        logger.error('Failed to sync judge', { judge: judge.name, error })
      }
    }

    return stats
  }

  /**
   * Discover new judges from CourtListener that we haven't imported yet
   */
  private async discoverNewJudgeIds(options: JudgeSyncOptions): Promise<string[]> {
    try {
      const existingIds = await this.getExistingCourtListenerIds(options)
      const summaries = await this.fetchJudgeSummariesFromCourtListener(options)

      const newJudgeIds: string[] = []

      for (const summary of summaries) {
        const judgeId = summary.id.toString()
        if (!existingIds.has(judgeId)) {
          newJudgeIds.push(judgeId)
        }
      }

      // Limit per run to avoid API exhaustion/timeouts. A driver script can loop until empty.
      const perRunLimit = Math.max(1, options.discoverLimit || (options.batchSize ? options.batchSize * 10 : 200))
      return newJudgeIds.slice(0, perRunLimit)

    } catch (error) {
      logger.error('Failed to discover new judges', { error })
      return []
    }
  }

  private async fetchJudgeSummariesFromCourtListener(options: JudgeSyncOptions) {
    const apiToken = process.env.COURTLISTENER_API_KEY || process.env.COURTLISTENER_API_TOKEN

    if (!apiToken) {
      throw new Error('COURTLISTENER_API_KEY is required to fetch judge data')
    }

    const baseUrl = 'https://www.courtlistener.com/api/rest/v4/people/'
    const results: Array<{ id: number | string }> = []
    const requestedJurisdiction = (options.jurisdiction || 'CA').toUpperCase()

    let nextUrl: string | null = `${baseUrl}?format=json&page_size=100&ordering=-date_modified`

    const jurisdictionFilter = this.buildCourtListenerJurisdictionFilter(requestedJurisdiction)
    if (jurisdictionFilter) {
      nextUrl += `&${jurisdictionFilter}`
    }

    // Allow larger discovery when requested; otherwise default to a safe cap
    const discoverCap = Math.max(50, options.discoverLimit || 500)

    while (nextUrl && results.length < discoverCap) {
      const response = await fetch(nextUrl, {
        headers: {
          'Authorization': `Token ${apiToken}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`CourtListener judge list error ${response.status}: ${errorText}`)
      }

      const data = await response.json() as { results: Array<{ id: number | string }>; next: string | null }
      results.push(...data.results)

      nextUrl = data.next
        ? data.next.startsWith('http')
          ? data.next
          : `https://www.courtlistener.com${data.next}`
        : null

      if (nextUrl) {
        await sleep(800)
      }
    }

    return results
  }

  private buildCourtListenerJurisdictionFilter(jurisdiction: string): string | null {
    if (jurisdiction === 'ALL' || jurisdiction === '') {
      return null
    }

    const normalized = jurisdiction.toUpperCase()

    // Federal requests map to the CourtListener jurisdiction code "F"
    if (['US', 'F', 'FEDERAL'].includes(normalized)) {
      return 'positions__court__jurisdiction=F'
    }

    // Two-letter state/territory codes map to the court state filter (CourtListener expects lowercase)
    if (/^[A-Z]{2}$/.test(normalized)) {
      return `positions__court__state=${normalized.toLowerCase()}`
    }

    // Fall back to the raw jurisdiction filter for any other valid CourtListener code (e.g., tribal, military)
    return `positions__court__jurisdiction=${normalized}`
  }

  private async getExistingCourtListenerIds(options: JudgeSyncOptions): Promise<Set<string>> {
    const ids = new Set<string>()
    const pageSize = 1000
    let from = 0

    while (true) {
      let query = this.supabase
        .from('judges')
        .select('courtlistener_id')
        .not('courtlistener_id', 'is', null)
        .range(from, from + pageSize - 1)

      if (options.jurisdiction) {
        query = query.eq('jurisdiction', options.jurisdiction)
      }

      const { data, error } = await query
      if (error) {
        throw new Error(`Failed to load existing CourtListener judge IDs: ${error.message}`)
      }

      const rows = data || []
      for (const row of rows) {
        if (row.courtlistener_id) {
          ids.add(row.courtlistener_id.toString())
        }
      }

      if (rows.length < pageSize) break
      from += pageSize
    }

    return ids
  }

  /**
   * Sync a single judge from CourtListener
   */
  private async syncSingleJudge(
    courtlistenerJudgeId: string, 
    options: JudgeSyncOptions
  ): Promise<{ updated: boolean; created: boolean; enhanced: boolean }> {
    try {
      // Fetch judge data from CourtListener
      const judgeData = await this.fetchJudgeFromCourtListener(courtlistenerJudgeId)
      
      if (!judgeData) {
        throw new Error(`Judge not found: ${courtlistenerJudgeId}`)
      }

      // Find existing judge in our database
      const existingJudge = await this.findExistingJudge(judgeData)

      if (existingJudge) {
        // Update existing judge
        const updated = await this.updateJudge(existingJudge.id, judgeData)
        const enhanced = await this.enhanceJudgeProfile(existingJudge.id, judgeData)
        return { updated, created: false, enhanced }
      } else {
        // Create new judge
        const judgeId = await this.createJudge(judgeData)
        const enhanced = await this.enhanceJudgeProfile(judgeId, judgeData)
        return { updated: false, created: true, enhanced }
      }

    } catch (error) {
      logger.error('Failed to sync single judge', { judgeId: courtlistenerJudgeId, error })
      throw error
    }
  }

  /**
   * Fetch judge data from CourtListener API
   */
  private async fetchJudgeFromCourtListener(judgeId: string): Promise<CourtListenerJudge | null> {
    try {
      const response = await fetch(`https://www.courtlistener.com/api/rest/v4/people/${judgeId}/`, {
        headers: {
          'Authorization': `Token ${process.env.COURTLISTENER_API_KEY}`,
          'Accept': 'application/json'
        }
      })

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(`CourtListener API error: ${response.status}`)
      }

      const data = await response.json()
      return data as CourtListenerJudge

    } catch (error) {
      logger.error('Failed to fetch judge from CourtListener', { judgeId, error })
      throw error
    }
  }

  /**
   * Find existing judge in database
   */
  private async findExistingJudge(judgeData: CourtListenerJudge) {
    const { data, error } = await this.supabase
      .from('judges')
      .select('id, name, courtlistener_id, updated_at')
      .eq('courtlistener_id', judgeData.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database query failed: ${error.message}`)
    }

    return data
  }

  /**
   * Update existing judge
   */
  private async updateJudge(judgeId: string, judgeData: CourtListenerJudge): Promise<boolean> {
    const updateData: any = {
      name: judgeData.name_full || judgeData.name,
      courtlistener_data: judgeData,
      updated_at: new Date().toISOString()
    }

    // Extract court assignment from positions
    if (judgeData.positions && judgeData.positions.length > 0) {
      const currentPosition = judgeData.positions.find(p => !p.date_termination) || judgeData.positions[0]
      if (currentPosition) {
        updateData.court_name = currentPosition.court?.full_name || currentPosition.court?.name
        updateData.jurisdiction = this.extractJurisdiction(currentPosition)
      }
    }

    const { error } = await this.supabase
      .from('judges')
      .update(updateData)
      .eq('id', judgeId)

    if (error) {
      throw new Error(`Failed to update judge: ${error.message}`)
    }

    return true
  }

  /**
   * Create new judge
   */
  private async createJudge(judgeData: CourtListenerJudge): Promise<string> {
    const insertData: any = {
      name: judgeData.name_full || judgeData.name,
      courtlistener_id: judgeData.id,
      courtlistener_data: judgeData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Extract court assignment from positions
    if (judgeData.positions && judgeData.positions.length > 0) {
      const currentPosition = judgeData.positions.find(p => !p.date_termination) || judgeData.positions[0]
      if (currentPosition) {
        insertData.court_name = currentPosition.court?.full_name || currentPosition.court?.name
        insertData.jurisdiction = this.extractJurisdiction(currentPosition)
        insertData.appointed_date = currentPosition.date_start
      }
    }

    const { data, error } = await this.supabase
      .from('judges')
      .insert(insertData)
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to create judge: ${error.message}`)
    }

    return data.id
  }

  /**
   * Enhance judge profile with additional data
   */
  private async enhanceJudgeProfile(judgeId: string, judgeData: CourtListenerJudge): Promise<boolean> {
    try {
      let enhanced = false
      const updateData: any = {}

      // Add education information
      if (judgeData.educations && judgeData.educations.length > 0) {
        const education = judgeData.educations
          .map(edu => `${edu.school?.name || 'Unknown'} (${edu.degree || 'Unknown degree'})`)
          .join('; ')
        updateData.education = education
        enhanced = true
      }

      // Add bio from positions
      if (judgeData.positions && judgeData.positions.length > 0) {
        const bio = judgeData.positions
          .map(pos => `${pos.position_type || 'Judge'} at ${pos.court?.full_name || pos.court?.name || 'Unknown Court'}`)
          .join('; ')
        updateData.bio = bio
        enhanced = true
      }

      if (enhanced) {
        const { error } = await this.supabase
          .from('judges')
          .update(updateData)
          .eq('id', judgeId)

        if (error) {
          throw new Error(`Failed to enhance judge profile: ${error.message}`)
        }
      }

      return enhanced

    } catch (error) {
      logger.error('Failed to enhance judge profile', { judgeId, error })
      return false
    }
  }

  /**
   * Extract jurisdiction from position data
   */
  private extractJurisdiction(position: any): string {
    const courtJurisdiction: string | undefined = position.court?.jurisdiction
    if (courtJurisdiction) {
      const normalized = normalizeJurisdiction(courtJurisdiction)
      if (normalized) {
        return normalized
      }
    }

    const courtName = position.court?.full_name || position.court?.name || ''
    
    if (courtName.includes('California') || courtName.includes('CA ')) return 'CA'
    if (courtName.includes('Federal') || courtName.includes('U.S.')) return 'US'
    
    return 'CA' // Default
  }

  /**
   * Log sync start
   */
  private async logSyncStart(syncType: string, options: any) {
    try {
      await this.supabase
        .from('sync_logs')
        .insert({
          sync_id: this.syncId,
          sync_type: syncType,
          status: 'started',
          options: options,
          started_at: new Date().toISOString()
        })
    } catch (error) {
      logger.error('Failed to log sync start', { error })
    }
  }

  /**
   * Log sync completion
   */
  private async logSyncCompletion(syncType: string, result: JudgeSyncResult) {
    try {
      await this.supabase
        .from('sync_logs')
        .update({
          status: result.success ? 'completed' : 'failed',
          result: result,
          completed_at: new Date().toISOString(),
          duration_ms: result.duration
        })
        .eq('sync_id', this.syncId)
    } catch (error) {
      logger.error('Failed to log sync completion', { error })
    }
  }

  /**
   * Log sync error
   */
  private async logSyncError(syncType: string, error: Error) {
    try {
      await this.supabase
        .from('sync_logs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('sync_id', this.syncId)
    } catch (logError) {
      logger.error('Failed to log sync error', { logError })
    }
  }

  private mergeStats(target: JudgeSyncResult, delta: BatchSyncStats) {
    target.judgesProcessed += delta.processed
    target.judgesUpdated += delta.updated
    target.judgesCreated += delta.created
    target.profilesEnhanced += delta.enhanced

    if (delta.errors.length > 0) {
      target.errors.push(...delta.errors)
    }
  }
}
