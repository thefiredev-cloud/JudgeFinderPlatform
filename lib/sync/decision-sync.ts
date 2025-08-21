/**
 * Decision Data Synchronization Module
 * Handles automated syncing of judicial decisions from CourtListener API
 */

import { createClient } from '@supabase/supabase-js'
import { CourtListenerClient } from '@/lib/courtlistener/client'
import { logger } from '@/lib/utils/logger'

interface DecisionSyncOptions {
  batchSize?: number
  jurisdiction?: string
  daysSinceLast?: number
  judgeIds?: string[]
  maxDecisionsPerJudge?: number
}

interface DecisionSyncResult {
  success: boolean
  judgesProcessed: number
  decisionsProcessed: number
  decisionsCreated: number
  decisionsUpdated: number
  duplicatesSkipped: number
  errors: string[]
  duration: number
}

interface CourtListenerDecision {
  id: number
  cluster_id: number
  case_name: string
  date_filed: string
  precedential_status: string
  author_id?: string
  author_str?: string
  date_created: string
}

export class DecisionSyncManager {
  private supabase: any
  private courtListener: CourtListenerClient
  private syncId: string

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    this.courtListener = new CourtListenerClient()
    this.syncId = `decision-sync-${Date.now()}`
  }

  /**
   * Main decision sync function
   */
  async syncDecisions(options: DecisionSyncOptions = {}): Promise<DecisionSyncResult> {
    const startTime = Date.now()
    const result: DecisionSyncResult = {
      success: false,
      judgesProcessed: 0,
      decisionsProcessed: 0,
      decisionsCreated: 0,
      decisionsUpdated: 0,
      duplicatesSkipped: 0,
      errors: [],
      duration: 0
    }

    try {
      logger.info('Starting decision data sync', { syncId: this.syncId, options })

      await this.logSyncStart('decision', options)

      // Get judges to sync decisions for
      const judgesToSync = await this.getJudgesForDecisionSync(options)
      result.judgesProcessed = judgesToSync.length

      if (judgesToSync.length === 0) {
        logger.info('No judges found for decision sync')
        result.success = true
        result.duration = Date.now() - startTime
        return result
      }

      // Process judges in batches to respect rate limits
      const batchSize = options.batchSize || 5 // Smaller batches for decisions
      
      for (let i = 0; i < judgesToSync.length; i += batchSize) {
        const batch = judgesToSync.slice(i, i + batchSize)
        
        try {
          const batchResult = await this.processBatch(batch, options)
          result.decisionsProcessed += batchResult.processed
          result.decisionsCreated += batchResult.created
          result.decisionsUpdated += batchResult.updated
          result.duplicatesSkipped += batchResult.duplicatesSkipped
        } catch (error) {
          const errorMsg = `Batch ${Math.floor(i / batchSize) + 1} failed: ${error}`
          result.errors.push(errorMsg)
          logger.error('Decision batch processing failed', { batch: i / batchSize + 1, error })
        }

        // Rate limiting - longer pause between batches for decisions
        if (i + batchSize < judgesToSync.length) {
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
      }

      result.duration = Date.now() - startTime
      result.success = result.errors.length === 0

      await this.logSyncCompletion('decision', result)

      logger.info('Decision sync completed', { 
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

      logger.error('Decision sync failed', { syncId: this.syncId, error })
      await this.logSyncError('decision', error as Error)
      
      return result
    }
  }

  /**
   * Get judges that need decision updates
   */
  private async getJudgesForDecisionSync(options: DecisionSyncOptions) {
    let query = this.supabase
      .from('judges')
      .select('id, name, courtlistener_id')
      .not('courtlistener_id', 'is', null)

    if (options.jurisdiction) {
      query = query.eq('jurisdiction', options.jurisdiction)
    }

    if (options.judgeIds && options.judgeIds.length > 0) {
      query = query.in('id', options.judgeIds)
    }

    const { data, error } = await query.limit(100) // Reasonable limit

    if (error) {
      throw new Error(`Failed to get judges for decision sync: ${error.message}`)
    }

    return data || []
  }

  /**
   * Process a batch of judges for decision updates
   */
  private async processBatch(judges: any[], options: DecisionSyncOptions) {
    let processed = 0
    let created = 0
    let updated = 0
    let duplicatesSkipped = 0

    for (const judge of judges) {
      try {
        const result = await this.syncJudgeDecisions(judge, options)
        processed += result.processed
        created += result.created
        updated += result.updated
        duplicatesSkipped += result.duplicatesSkipped

        // Small delay between judges
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        logger.error('Failed to sync decisions for judge', { 
          judge: judge.name, 
          judgeId: judge.id, 
          error 
        })
        // Continue with other judges
      }
    }

    return { processed, created, updated, duplicatesSkipped }
  }

  /**
   * Sync decisions for a single judge
   */
  private async syncJudgeDecisions(judge: any, options: DecisionSyncOptions) {
    const result = {
      processed: 0,
      created: 0,
      updated: 0,
      duplicatesSkipped: 0
    }

    try {
      // Determine date range for fetching decisions
      const sinceDate = await this.getSinceDateForJudge(judge.id, options)
      
      logger.info('Syncing decisions for judge', { 
        judge: judge.name, 
        courtlistenerId: judge.courtlistener_id, 
        sinceDate 
      })

      // Fetch recent decisions from CourtListener
      const decisions = await this.fetchJudgeDecisions(judge.courtlistener_id, sinceDate, options)
      result.processed = decisions.length

      if (decisions.length === 0) {
        logger.info('No new decisions found for judge', { judge: judge.name })
        return result
      }

      // Check for existing decisions to avoid duplicates
      const existingDecisions = await this.getExistingDecisions(
        judge.id, 
        decisions.map(d => d.id.toString())
      )

      // Process new decisions
      for (const decision of decisions) {
        const courtlistenerId = decision.id.toString()
        
        if (existingDecisions.has(courtlistenerId)) {
          result.duplicatesSkipped++
          continue
        }

        try {
          await this.createDecision(judge.id, decision)
          result.created++
        } catch (error) {
          logger.error('Failed to create decision', { 
            judge: judge.name, 
            decision: decision.case_name, 
            error 
          })
        }
      }

      // Update judge's total_cases count
      await this.updateJudgeCaseCount(judge.id)

      logger.info('Completed decision sync for judge', { 
        judge: judge.name, 
        result 
      })

      return result

    } catch (error) {
      logger.error('Error syncing judge decisions', { judge: judge.name, error })
      throw error
    }
  }

  /**
   * Get the date from which to fetch decisions for a judge
   */
  private async getSinceDateForJudge(judgeId: string, options: DecisionSyncOptions): Promise<string> {
    if (options.daysSinceLast) {
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - options.daysSinceLast)
      return daysAgo.toISOString().split('T')[0]
    }

    // Get the last decision date for this judge
    const { data, error } = await this.supabase
      .from('cases')
      .select('decision_date')
      .eq('judge_id', judgeId)
      .not('decision_date', 'is', null)
      .order('decision_date', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      // No previous decisions, go back 90 days
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      return ninetyDaysAgo.toISOString().split('T')[0]
    }

    // Start from the day after the last decision
    const lastDate = new Date(data.decision_date)
    lastDate.setDate(lastDate.getDate() + 1)
    return lastDate.toISOString().split('T')[0]
  }

  /**
   * Fetch decisions for a judge from CourtListener
   */
  private async fetchJudgeDecisions(
    courtlistenerJudgeId: string, 
    sinceDate: string, 
    options: DecisionSyncOptions
  ): Promise<CourtListenerDecision[]> {
    const maxDecisions = options.maxDecisionsPerJudge || 50
    
    try {
      const decisions = await this.courtListener.getRecentOpinionsByJudge(
        courtlistenerJudgeId, 
        1 // 1 year back maximum for incremental updates
      )

      // Filter by date and limit
      const filteredDecisions = decisions
        .filter(decision => decision.date_filed >= sinceDate)
        .slice(0, maxDecisions)

      return filteredDecisions

    } catch (error) {
      logger.error('Failed to fetch decisions from CourtListener', { 
        judgeId: courtlistenerJudgeId, 
        error 
      })
      throw error
    }
  }

  /**
   * Get existing decisions to avoid duplicates
   */
  private async getExistingDecisions(judgeId: string, courtlistenerIds: string[]): Promise<Set<string>> {
    if (courtlistenerIds.length === 0) return new Set()

    const { data, error } = await this.supabase
      .from('cases')
      .select('courtlistener_id')
      .eq('judge_id', judgeId)
      .in('courtlistener_id', courtlistenerIds)

    if (error) {
      logger.error('Failed to get existing decisions', { error })
      return new Set()
    }

    return new Set(data?.map((d: any) => d.courtlistener_id) || [])
  }

  /**
   * Create a new decision record
   */
  private async createDecision(judgeId: string, decision: CourtListenerDecision) {
    const caseRecord = {
      judge_id: judgeId,
      case_name: decision.case_name.substring(0, 500), // Truncate if too long
      case_number: `CL-${decision.cluster_id}`,
      decision_date: decision.date_filed,
      filing_date: decision.date_filed,
      case_type: 'Opinion',
      status: 'decided' as const,
      outcome: decision.precedential_status || null,
      summary: `CourtListener opinion ${decision.id}`,
      courtlistener_id: decision.id.toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error } = await this.supabase
      .from('cases')
      .insert(caseRecord)

    if (error) {
      // Check if it's a duplicate key error
      if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        logger.warn('Decision already exists', { 
          judgeId, 
          caseNumber: caseRecord.case_number 
        })
        return
      }
      throw new Error(`Failed to create decision: ${error.message}`)
    }
  }

  /**
   * Update judge's total case count
   */
  private async updateJudgeCaseCount(judgeId: string) {
    try {
      const { data, error } = await this.supabase
        .from('cases')
        .select('id', { count: 'exact' })
        .eq('judge_id', judgeId)
        .eq('status', 'decided')

      if (error) {
        logger.error('Failed to count cases for judge', { judgeId, error })
        return
      }

      const caseCount = data?.length || 0

      await this.supabase
        .from('judges')
        .update({ 
          total_cases: caseCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', judgeId)

    } catch (error) {
      logger.error('Failed to update judge case count', { judgeId, error })
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
  private async logSyncCompletion(syncType: string, result: DecisionSyncResult) {
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