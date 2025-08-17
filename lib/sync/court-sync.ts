/**
 * Court Data Synchronization Module
 * Handles automated syncing of court data from CourtListener API
 */

import { createClient } from '@supabase/supabase-js'
import { CourtListenerClient } from '@/lib/courtlistener/client'
import { logger } from '@/lib/utils/logger'

interface CourtSyncOptions {
  batchSize?: number
  jurisdiction?: string
  forceRefresh?: boolean
}

interface CourtSyncResult {
  success: boolean
  courtsProcessed: number
  courtsUpdated: number
  courtsCreated: number
  errors: string[]
  duration: number
}

interface CourtListenerCourt {
  id: string
  name: string
  full_name: string
  jurisdiction: string
  url?: string
  position?: string
  date_created?: string
  date_modified?: string
}

export class CourtSyncManager {
  private supabase: any
  private courtListener: CourtListenerClient
  private syncId: string

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    this.courtListener = new CourtListenerClient()
    this.syncId = `court-sync-${Date.now()}`
  }

  /**
   * Main sync function - fetches and updates all court data
   */
  async syncCourts(options: CourtSyncOptions = {}): Promise<CourtSyncResult> {
    const startTime = Date.now()
    const result: CourtSyncResult = {
      success: false,
      courtsProcessed: 0,
      courtsUpdated: 0,
      courtsCreated: 0,
      errors: [],
      duration: 0
    }

    try {
      logger.info('Starting court data sync', { syncId: this.syncId, options })

      // Log sync start
      await this.logSyncStart('court', options)

      // Fetch courts from CourtListener
      const courtListenerCourts = await this.fetchCourtsFromCourtListener(options)
      result.courtsProcessed = courtListenerCourts.length

      // Process courts in batches
      const batchSize = options.batchSize || 20
      for (let i = 0; i < courtListenerCourts.length; i += batchSize) {
        const batch = courtListenerCourts.slice(i, i + batchSize)
        
        try {
          const batchResult = await this.processCourtsLatch(batch, options)
          result.courtsUpdated += batchResult.updated
          result.courtsCreated += batchResult.created
        } catch (error) {
          const errorMsg = `Batch ${Math.floor(i / batchSize) + 1} failed: ${error}`
          result.errors.push(errorMsg)
          logger.error('Court batch processing failed', { batch: i / batchSize + 1, error })
        }

        // Rate limiting - pause between batches
        if (i + batchSize < courtListenerCourts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      result.duration = Date.now() - startTime
      result.success = result.errors.length === 0

      // Log sync completion
      await this.logSyncCompletion('court', result)

      logger.info('Court sync completed', { 
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

      logger.error('Court sync failed', { syncId: this.syncId, error })
      
      await this.logSyncError('court', error as Error)
      
      return result
    }
  }

  /**
   * Fetch courts from CourtListener API
   */
  private async fetchCourtsFromCourtListener(options: CourtSyncOptions): Promise<CourtListenerCourt[]> {
    // Note: CourtListener uses /courts/ endpoint
    // This is a placeholder implementation - actual API structure may vary
    try {
      const response = await fetch('https://www.courtlistener.com/api/rest/v4/courts/', {
        headers: {
          'Authorization': `Token ${process.env.COURTLISTENER_API_KEY}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`CourtListener API error: ${response.status}`)
      }

      const data = await response.json()
      let courts = data.results || []

      // Filter by jurisdiction if specified
      if (options.jurisdiction) {
        courts = courts.filter((court: any) => 
          court.jurisdiction === options.jurisdiction ||
          court.full_name?.includes(options.jurisdiction)
        )
      }

      logger.info('Fetched courts from CourtListener', { count: courts.length })
      return courts

    } catch (error) {
      logger.error('Failed to fetch courts from CourtListener', { error })
      throw error
    }
  }

  /**
   * Process a batch of courts
   */
  private async processCourtsLatch(
    courts: CourtListenerCourt[], 
    options: CourtSyncOptions
  ): Promise<{ updated: number; created: number }> {
    let updated = 0
    let created = 0

    for (const courtData of courts) {
      try {
        const existingCourt = await this.findExistingCourt(courtData)
        
        if (existingCourt) {
          // Update existing court
          const shouldUpdate = options.forceRefresh || await this.shouldUpdateCourt(existingCourt, courtData)
          
          if (shouldUpdate) {
            await this.updateCourt(existingCourt.id, courtData)
            updated++
          }
        } else {
          // Create new court
          await this.createCourt(courtData)
          created++
        }
      } catch (error) {
        logger.error('Failed to process court', { court: courtData.name, error })
        throw error
      }
    }

    return { updated, created }
  }

  /**
   * Find existing court in database
   */
  private async findExistingCourt(courtData: CourtListenerCourt) {
    const { data, error } = await this.supabase
      .from('courts')
      .select('id, name, courtlistener_id, updated_at')
      .or(`courtlistener_id.eq.${courtData.id},name.eq."${courtData.name}"`)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database query failed: ${error.message}`)
    }

    return data
  }

  /**
   * Check if court needs updating
   */
  private async shouldUpdateCourt(existingCourt: any, newData: CourtListenerCourt): Promise<boolean> {
    // Update if name changed or it's been more than 7 days
    const lastUpdate = new Date(existingCourt.updated_at)
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
    
    return (
      existingCourt.name !== newData.name ||
      existingCourt.courtlistener_id !== newData.id ||
      daysSinceUpdate > 7
    )
  }

  /**
   * Update existing court
   */
  private async updateCourt(courtId: string, courtData: CourtListenerCourt) {
    const { error } = await this.supabase
      .from('courts')
      .update({
        name: courtData.name || courtData.full_name,
        courtlistener_id: courtData.id,
        jurisdiction: this.extractJurisdiction(courtData),
        website: courtData.url,
        updated_at: new Date().toISOString()
      })
      .eq('id', courtId)

    if (error) {
      throw new Error(`Failed to update court: ${error.message}`)
    }
  }

  /**
   * Create new court
   */
  private async createCourt(courtData: CourtListenerCourt) {
    const { error } = await this.supabase
      .from('courts')
      .insert({
        name: courtData.name || courtData.full_name,
        type: this.determineCourtType(courtData),
        jurisdiction: this.extractJurisdiction(courtData),
        courtlistener_id: courtData.id,
        website: courtData.url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      throw new Error(`Failed to create court: ${error.message}`)
    }
  }

  /**
   * Extract jurisdiction from court data
   */
  private extractJurisdiction(courtData: CourtListenerCourt): string {
    if (courtData.jurisdiction) return courtData.jurisdiction
    
    const name = courtData.name || courtData.full_name || ''
    
    // Extract state from court name
    if (name.includes('California') || name.includes('CA ')) return 'CA'
    if (name.includes('Federal') || name.includes('U.S.')) return 'US'
    
    // Default to state jurisdiction
    return 'CA'
  }

  /**
   * Determine court type from court data
   */
  private determineCourtType(courtData: CourtListenerCourt): string {
    const name = courtData.name || courtData.full_name || ''
    
    if (name.includes('Federal') || name.includes('U.S.') || name.includes('Circuit')) {
      return 'federal'
    }
    if (name.includes('Superior') || name.includes('District') || name.includes('County')) {
      return 'state'
    }
    
    return 'state' // Default
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
  private async logSyncCompletion(syncType: string, result: CourtSyncResult) {
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