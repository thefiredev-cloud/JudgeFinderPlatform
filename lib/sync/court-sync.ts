/**
 * Court Data Synchronization Module
 * Handles automated syncing of court data from CourtListener API
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CourtListenerClient, type CourtListenerCourt } from '@/lib/courtlistener/client'
import { logger } from '@/lib/utils/logger'
import { sleep } from '@/lib/utils/helpers'

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

export class CourtSyncManager {
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
          page_url: '/lib/sync/court-sync',
          page_type: 'sync',
          metric_id: name,
          rating: 'needs-improvement',
          metadata: meta || null
        })
      } catch (_) {}
    })
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
      logger.info('Fetched courts from CourtListener', { count: courtListenerCourts.length })
      result.courtsProcessed = courtListenerCourts.length

      // Process courts in batches
      const batchSize = options.batchSize || 20
      for (let i = 0; i < courtListenerCourts.length; i += batchSize) {
        const batch = courtListenerCourts.slice(i, i + batchSize)
        
        const batchResult = await this.processCourtsBatch(batch, options)
        result.courtsUpdated += batchResult.updated
        result.courtsCreated += batchResult.created
        if (batchResult.errors.length > 0) {
          result.errors.push(...batchResult.errors)
        }

        // Rate limiting - pause between batches
        if (i + batchSize < courtListenerCourts.length) {
          await sleep(1000)
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
    const collected: CourtListenerCourt[] = []
    let cursor: string | null = null

    try {
      do {
        const response = await this.courtListener.listCourts({
          cursorUrl: cursor,
          ordering: '-date_modified'
        })

        const results = response.results || []
        collected.push(...results)
        cursor = response.next

        // Respect CourtListener pacing
        if (cursor) {
          await sleep(750)
        }
      } while (cursor && collected.length < 1000)

      let courts = collected

      if (options.jurisdiction) {
        const matcher = options.jurisdiction.toUpperCase()
        courts = courts.filter(court => (
          court.jurisdiction?.toUpperCase() === matcher ||
          court.full_name?.toUpperCase().includes(matcher) ||
          court.name?.toUpperCase().includes(matcher)
        ))
      }

      logger.info('Fetched courts from CourtListener', { count: courts.length })
      return courts
    } catch (error) {
      logger.error('Failed to fetch courts from CourtListener', { error })
      try {
        await this.supabase.from('performance_metrics').insert({
          metric_name: 'courtlistener_fetch_courts_failed',
          metric_value: 1,
          page_url: '/lib/sync/court-sync',
          page_type: 'sync',
          metric_id: 'fetch_courts_failed',
          rating: 'poor',
          metadata: { error: error instanceof Error ? error.message : String(error) }
        })
      } catch (_) {}
      throw error
    }
  }

  /**
   * Process a batch of courts
   */
  private async processCourtsBatch(
    courts: CourtListenerCourt[], 
    options: CourtSyncOptions
  ): Promise<{ updated: number; created: number; errors: string[] }> {
    let updated = 0
    let created = 0
    const errors: string[] = []

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
        const details = error instanceof Error ? error.message : String(error)
        errors.push(`Failed to process court ${courtData.name}: ${details}`)
        logger.error('Failed to process court', { court: courtData.name, error })
      }
    }

    return { updated, created, errors }
  }

  /**
   * Find existing court in database
   */
  private async findExistingCourt(courtData: CourtListenerCourt) {
    try {
      const { data: byId, error: byIdError } = await this.supabase
        .from('courts')
        .select('id, name, courtlistener_id, updated_at, courthouse_metadata')
        .eq('courtlistener_id', courtData.id)
        .maybeSingle()

      if (byIdError) {
        throw new Error(`Database query failed: ${byIdError.message}`)
      }

      if (byId) {
        return byId
      }

      if (!courtData.name) {
        return null
      }

      const { data: byName, error: byNameError } = await this.supabase
        .from('courts')
        .select('id, name, courtlistener_id, updated_at, courthouse_metadata')
        .ilike('name', courtData.name)
        .maybeSingle()

      if (byNameError && byNameError.code !== 'PGRST116') {
        throw new Error(`Database query failed: ${byNameError.message}`)
      }

      return byName
    } catch (error) {
      throw error
    }
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
    const metadata = this.buildCourthouseMetadata(courtData)
    const { error } = await this.supabase
      .from('courts')
      .update({
        name: courtData.name || courtData.full_name,
        courtlistener_id: courtData.id,
        jurisdiction: this.extractJurisdiction(courtData),
        website: courtData.url,
        address: courtData.location || null,
        courthouse_metadata: metadata,
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
    const metadata = this.buildCourthouseMetadata(courtData)
    const { error } = await this.supabase
      .from('courts')
      .insert({
        name: courtData.name || courtData.full_name,
        type: this.determineCourtType(courtData),
        jurisdiction: this.extractJurisdiction(courtData),
        courtlistener_id: courtData.id,
        website: courtData.url,
        address: courtData.location || null,
        courthouse_metadata: metadata,
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
   * Build structured courthouse metadata for persistence
   */
  private buildCourthouseMetadata(courtData: CourtListenerCourt) {
    return {
      source: 'courtlistener',
      sync_id: this.syncId,
      fetched_at: new Date().toISOString(),
      short_name: courtData.short_name || null,
      citation_string: courtData.citation_string || null,
      in_use: typeof courtData.in_use === 'boolean' ? courtData.in_use : null,
      has_opinion_scraper: typeof courtData.has_opinion_scraper === 'boolean' ? courtData.has_opinion_scraper : null,
      has_oral_argument_scraper: typeof courtData.has_oral_argument_scraper === 'boolean' ? courtData.has_oral_argument_scraper : null,
      position_count: courtData.position_count ?? null,
      established_date: courtData.start_date || courtData.date_created || null,
      retired_date: courtData.end_date || null,
      location: courtData.location || null,
      raw: courtData
    }
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
