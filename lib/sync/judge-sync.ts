/**
 * Judge Data Synchronization Module
 * Handles automated syncing of judge data from CourtListener API
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CourtListenerClient, type CourtListenerJudge } from '@/lib/courtlistener/client'
import { logger } from '@/lib/utils/logger'
import { sleep } from '@/lib/utils/helpers'
import { normalizeJurisdiction } from '@/lib/sync/normalization'
import { SupabaseServiceRoleFactory } from '@/lib/supabase/service-role'

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

interface BatchSyncStats {
  processed: number
  updated: number
  created: number
  enhanced: number
  errors: string[]
}

export interface JudgeSyncDependencies {
  supabase: SupabaseClient
  courtListener: CourtListenerClient
}

export class JudgeSyncManager {
  private readonly supabase: SupabaseClient
  private readonly courtListener: CourtListenerClient
  private readonly syncId: string
  private readonly maxBatchSize = 25
  private readonly defaultBatchSize = 10
  private readonly perRunJudgeLimit = 250
  private readonly perRunCreateLimit = 150
  private processedCount = 0
  private createdCount = 0

  constructor(dependencies?: Partial<JudgeSyncDependencies>) {
    this.supabase = dependencies?.supabase ?? this.createSupabaseServiceRoleClient()
    this.courtListener = dependencies?.courtListener ?? this.createCourtListenerClient()
    this.syncId = `judge-sync-${Date.now()}`
  }

  private createSupabaseServiceRoleClient(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase credentials missing: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    }

    return new SupabaseServiceRoleFactory({
      url: supabaseUrl,
      serviceRoleKey
    }).create()
  }

  private createCourtListenerClient(): CourtListenerClient {
    const client = new CourtListenerClient()
    client.setMetricsReporter(async (name, value, meta) => {
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
    return client
  }

  private resolveBatchSize(requested?: number): number {
    if (!requested) {
      return this.defaultBatchSize
    }

    if (requested < 1) {
      return 1
    }

    return Math.min(requested, this.maxBatchSize)
  }

  private shouldAbortSync(): boolean {
    if (this.processedCount >= this.perRunJudgeLimit) {
      return true
    }

    if (this.createdCount >= this.perRunCreateLimit) {
      return true
    }

    return false
  }

  private trackBatchOutcome(result: { processed: number; created: number }) {
    this.processedCount += result.processed
    this.createdCount += result.created
  }

  private resetRunLimits() {
    this.processedCount = 0
    this.createdCount = 0
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

    const batchSize = this.resolveBatchSize(options.batchSize)

    for (let i = 0; i < judgeIds.length; i += batchSize) {
      if (this.shouldAbortSync()) {
        stats.errors.push('Run limits reached; aborting remaining judge sync operations')
        break
      }

      const batch = judgeIds.slice(i, i + batchSize)
      
      try {
        for (const judgeId of batch) {
          if (this.shouldAbortSync()) {
            stats.errors.push('Run limits reached during batch processing')
            break
          }

          const processed = await this.syncSingleJudge(judgeId, options)
          if (processed.updated) stats.updated++
          if (processed.created) {
            stats.created++
            this.createdCount++
          }
          if (processed.enhanced) stats.enhanced++
          stats.processed++
        }
      } catch (error) {
        const details = error instanceof Error ? error.message : String(error)
        stats.errors.push(`Batch processing failed: ${details}`)
      }

      this.trackBatchOutcome({ processed: batch.length, created: stats.created })

      // Rate limiting
      if (i + batchSize < judgeIds.length && !this.shouldAbortSync()) {
        await sleep(1000)
      }

      if (this.shouldAbortSync()) {
        break
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
      const batchSize = this.resolveBatchSize(options.batchSize)

      for (let i = 0; i < judgesToSync.length; i += batchSize) {
        if (this.shouldAbortSync()) {
          stats.errors.push('Run limits reached; aborting remaining judge sync operations')
          break
        }

        const batch = judgesToSync.slice(i, i + batchSize)
        
        try {
          const batchResult = await this.processBatch(batch, options)
          stats.processed += batchResult.processed
          stats.updated += batchResult.updated
          stats.created += batchResult.created
          stats.enhanced += batchResult.enhanced
          stats.errors.push(...batchResult.errors)

          this.trackBatchOutcome({ processed: batchResult.processed, created: batchResult.created })
        } catch (error) {
          const details = error instanceof Error ? error.message : String(error)
          stats.errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${details}`)
        }

        // Rate limiting
        if (i + batchSize < judgesToSync.length && !this.shouldAbortSync()) {
          await sleep(2000)
        }

        if (this.shouldAbortSync()) {
          break
        }
      }
    }

    // Discover and import new judges that are not yet in our database
    if (!this.shouldAbortSync()) {
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
      if (this.shouldAbortSync()) {
        stats.errors.push('Run limits reached during judge batch processing')
        break
      }

      try {
        const result = await this.syncSingleJudge(judge.courtlistener_id, options)
        if (result.updated) stats.updated++
        if (result.created) {
          stats.created++
          this.createdCount++
        }
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
      const newIds: Set<string> = new Set()
      const discoverCap = Math.max(50, options.discoverLimit || this.perRunJudgeLimit)
      let cursor: string | null = null
      const filters = this.buildCourtListenerJurisdictionFilters(options.jurisdiction)

      while (newIds.size < discoverCap && !this.shouldAbortSync()) {
        const response = await this.courtListener.listJudges({
          cursorUrl: cursor,
          ordering: '-date_modified',
          filters
        })

        for (const judge of response.results || []) {
          const judgeId = judge.id.toString()
          if (!existingIds.has(judgeId)) {
            newIds.add(judgeId)
            if (newIds.size >= discoverCap) break
          }
        }

        if (!response.next) {
          break
        }

        cursor = response.next
        await sleep(750)
      }

      const perRunLimit = Math.max(1, Math.min(options.discoverLimit || (options.batchSize ? options.batchSize * 5 : 150), this.perRunCreateLimit - this.createdCount))
      return Array.from(newIds).slice(0, perRunLimit)

    } catch (error) {
      logger.error('Failed to discover new judges', { error })
      return []
    }
  }

  private buildCourtListenerJurisdictionFilters(jurisdiction?: string): Record<string, string> {
    if (!jurisdiction || jurisdiction.toUpperCase() === 'ALL') {
      return {}
    }

    const normalized = jurisdiction.toUpperCase()

    if (['US', 'F', 'FEDERAL'].includes(normalized)) {
      return { 'positions__court__jurisdiction': 'F' }
    }

    if (/^[A-Z]{2}$/.test(normalized)) {
      return { 'positions__court__state': normalized.toLowerCase() }
    }

    return { 'positions__court__jurisdiction': normalized }
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
        if (this.shouldAbortSync()) {
          return { updated: false, created: false, enhanced: false }
        }

        const judgeId = await this.createJudge(judgeData)
        const enhanced = await this.enhanceJudgeProfile(judgeId, judgeData)
        this.createdCount++
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
      return await this.courtListener.getJudgeById(judgeId)
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
