/**
 * Judge Data Synchronization Module
 * Handles automated syncing of judge data from CourtListener API
 */

import { createClient } from '@supabase/supabase-js'
import { CourtListenerClient } from '@/lib/courtlistener/client'
import { logger } from '@/lib/utils/logger'

interface JudgeSyncOptions {
  batchSize?: number
  jurisdiction?: string
  forceRefresh?: boolean
  judgeIds?: string[] // Specific judges to sync
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

export class JudgeSyncManager {
  private supabase: any
  private courtListener: CourtListenerClient
  private syncId: string

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    this.courtListener = new CourtListenerClient()
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
        // Sync specific judges
        await this.syncSpecificJudges(options.judgeIds, options, result)
      } else {
        // Sync all judges or by jurisdiction
        await this.syncAllJudges(options, result)
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
    options: JudgeSyncOptions, 
    result: JudgeSyncResult
  ) {
    const batchSize = options.batchSize || 10

    for (let i = 0; i < judgeIds.length; i += batchSize) {
      const batch = judgeIds.slice(i, i + batchSize)
      
      try {
        for (const judgeId of batch) {
          const processed = await this.syncSingleJudge(judgeId, options)
          if (processed.updated) result.judgesUpdated++
          if (processed.created) result.judgesCreated++
          if (processed.enhanced) result.profilesEnhanced++
          result.judgesProcessed++
        }
      } catch (error) {
        result.errors.push(`Batch processing failed: ${error}`)
      }

      // Rate limiting
      if (i + batchSize < judgeIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  /**
   * Sync all judges (with jurisdiction filter)
   */
  private async syncAllJudges(options: JudgeSyncOptions, result: JudgeSyncResult) {
    // Get judges from our database that need updating
    const judgesToSync = await this.getJudgesNeedingUpdate(options)
    result.judgesProcessed = judgesToSync.length

    const batchSize = options.batchSize || 10

    for (let i = 0; i < judgesToSync.length; i += batchSize) {
      const batch = judgesToSync.slice(i, i + batchSize)
      
      try {
        const batchResult = await this.processBatch(batch, options)
        result.judgesUpdated += batchResult.updated
        result.judgesCreated += batchResult.created
        result.profilesEnhanced += batchResult.enhanced
      } catch (error) {
        result.errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${error}`)
      }

      // Rate limiting
      if (i + batchSize < judgesToSync.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
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
  private async processBatch(judges: any[], options: JudgeSyncOptions) {
    let updated = 0
    let created = 0
    let enhanced = 0

    for (const judge of judges) {
      try {
        const result = await this.syncSingleJudge(judge.courtlistener_id, options)
        if (result.updated) updated++
        if (result.created) created++
        if (result.enhanced) enhanced++
      } catch (error) {
        logger.error('Failed to sync judge', { judge: judge.name, error })
        // Continue with other judges
      }
    }

    return { updated, created, enhanced }
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
    if (position.court?.jurisdiction) return position.court.jurisdiction
    
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
}