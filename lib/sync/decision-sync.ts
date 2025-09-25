/**
 * Decision Data Synchronization Module
 * Handles automated syncing of judicial decisions from CourtListener API
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CourtListenerClient, type CourtListenerDocket } from '@/lib/courtlistener/client'
import { logger } from '@/lib/utils/logger'
import { sleep } from '@/lib/utils/helpers'
import {
  createDocketHash,
  normalizeCaseNumber,
  normalizeOutcomeLabel,
  normalizeJurisdiction,
  toTitle
} from '@/lib/sync/normalization'
import { getDecisionKey, determineCaseOutcomeAndStatus, classifyCaseTypeFromDocket, formatDate, buildCaseSummaryFromDocket, buildCourtListenerUrl } from '@/lib/sync/decision-helpers'
import { syncJudgeFilings as syncJudgeFilingsExternal } from '@/lib/sync/decision-filings'
import { DecisionRepository } from '@/lib/sync/decision-repository'
import { ensureOpinionForCase as ensureOpinionForCaseExternal } from '@/lib/sync/decision-opinions'

interface DecisionSyncOptions {
  batchSize?: number
  jurisdiction?: string
  daysSinceLast?: number
  judgeIds?: string[]
  maxDecisionsPerJudge?: number
  yearsBack?: number
  includeDockets?: boolean
  maxFilingsPerJudge?: number
  filingYearsBack?: number
  filingDaysSinceLast?: number
}

interface DecisionSyncResult {
  success: boolean
  judgesProcessed: number
  decisionsProcessed: number
  decisionsCreated: number
  decisionsUpdated: number
  duplicatesSkipped: number
  filingsProcessed: number
  filingsCreated: number
  filingsUpdated: number
  filingsSkipped: number
  errors: string[]
  duration: number
}

interface ExistingFilingMaps {
  byCaseNumber: Map<string, { id: string }>
  byHash: Map<string, { id: string }>
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
  opinion_id?: number
}

export class DecisionSyncManager {
  private supabase: SupabaseClient
  private courtListener: CourtListenerClient
  private syncId: string
  private repository: DecisionRepository

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
          page_url: '/lib/sync/decision-sync',
          page_type: 'sync',
          metric_id: name,
          rating: 'needs-improvement',
          metadata: meta || null
        })
      } catch (_) {}
    })
    this.syncId = `decision-sync-${Date.now()}`
    this.repository = new DecisionRepository(this.supabase)
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
      filingsProcessed: 0,
      filingsCreated: 0,
      filingsUpdated: 0,
      filingsSkipped: 0,
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
          result.decisionsProcessed += batchResult.decisionsProcessed
          result.decisionsCreated += batchResult.decisionsCreated
          result.decisionsUpdated += batchResult.decisionsUpdated
          result.duplicatesSkipped += batchResult.duplicatesSkipped
          result.filingsProcessed += batchResult.filingsProcessed
          result.filingsCreated += batchResult.filingsCreated
          result.filingsUpdated += batchResult.filingsUpdated
          result.filingsSkipped += batchResult.filingsSkipped
        } catch (error) {
          const errorMsg = `Batch ${Math.floor(i / batchSize) + 1} failed: ${error}`
          result.errors.push(errorMsg)
          logger.error('Decision batch processing failed', { batch: i / batchSize + 1, error })
        }

        // Rate limiting - longer pause between batches for decisions
        if (i + batchSize < judgesToSync.length) {
          await sleep(3000)
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
    let decisionsProcessed = 0
    let decisionsCreated = 0
    let decisionsUpdated = 0
    let duplicatesSkipped = 0
    let filingsProcessed = 0
    let filingsCreated = 0
    let filingsUpdated = 0
    let filingsSkipped = 0

    for (const judge of judges) {
      try {
        const result = await this.syncJudgeDecisions(judge, options)
        decisionsProcessed += result.decisionsProcessed
        decisionsCreated += result.decisionsCreated
        decisionsUpdated += result.decisionsUpdated
        duplicatesSkipped += result.duplicatesSkipped
        filingsProcessed += result.filingsProcessed
        filingsCreated += result.filingsCreated
        filingsUpdated += result.filingsUpdated
        filingsSkipped += result.filingsSkipped

        // Small delay between judges
        await sleep(1000)

      } catch (error) {
        logger.error('Failed to sync decisions for judge', { 
          judge: judge.name, 
          judgeId: judge.id, 
          error 
        })
        // Continue with other judges
      }
    }

    return {
      decisionsProcessed,
      decisionsCreated,
      decisionsUpdated,
      duplicatesSkipped,
      filingsProcessed,
      filingsCreated,
      filingsUpdated,
      filingsSkipped
    }
  }

  /**
   * Sync decisions for a single judge
   */
  private async syncJudgeDecisions(judge: any, options: DecisionSyncOptions) {
    const decisionStats = {
      processed: 0,
      created: 0,
      updated: 0,
      duplicatesSkipped: 0
    }

    let filingStats = {
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0
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
      decisionStats.processed = decisions.length

      if (decisions.length === 0) {
        logger.info('No new decisions found for judge', { judge: judge.name })
      } else {
        // Check for existing decisions to avoid duplicates
        const decisionKeys = decisions
          .map(decision => getDecisionKey(decision))
          .filter(Boolean) as string[]
        const existingDecisions = await this.repository.getExistingDecisions(judge.id, decisionKeys)

        await this.processDecisionsForJudge(judge, decisions, existingDecisions, decisionStats)
      }

      if (options.includeDockets !== false) {
        filingStats = await syncJudgeFilingsExternal(this.supabase, this.courtListener, judge, options)
      }

      // Update judge's total case count after decisions and filings
      await this.repository.updateJudgeCaseCount(judge.id)

      logger.info('Completed decision sync for judge', {
        judge: judge.name,
        decisions: decisionStats,
        filings: filingStats
      })

      return {
        decisionsProcessed: decisionStats.processed,
        decisionsCreated: decisionStats.created,
        decisionsUpdated: decisionStats.updated,
        duplicatesSkipped: decisionStats.duplicatesSkipped,
        filingsProcessed: filingStats.processed,
        filingsCreated: filingStats.created,
        filingsUpdated: filingStats.updated,
        filingsSkipped: filingStats.skipped
      }

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
      if (options.yearsBack && options.yearsBack > 0) {
        const yearsAgo = new Date()
        yearsAgo.setFullYear(yearsAgo.getFullYear() - options.yearsBack)
        return yearsAgo.toISOString().split('T')[0]
      }

      // No previous decisions, go back 90 days by default
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
   * Get the date from which to fetch filings (dockets) for a judge
   */
  

  /**
   * Fetch decisions for a judge from CourtListener
   */
  private async fetchJudgeDecisions(
    courtlistenerJudgeId: string, 
    sinceDate: string, 
    options: DecisionSyncOptions
  ): Promise<CourtListenerDecision[]> {
    const maxDecisions = options.maxDecisionsPerJudge || 150
    const yearsBack = options.yearsBack && options.yearsBack > 0 ? options.yearsBack : 5
    
    try {
      const decisions = await this.courtListener.getRecentOpinionsByJudge(
        courtlistenerJudgeId, 
        yearsBack
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
      try {
        await this.supabase.from('performance_metrics').insert({
          metric_name: 'courtlistener_fetch_decisions_failed',
          metric_value: 1,
          page_url: '/lib/sync/decision-sync',
          page_type: 'sync',
          metric_id: 'fetch_decisions_failed',
          rating: 'poor'
        })
      } catch (_) {}
      throw error
    }
  }




  private buildCaseRecordFromDocket(
    judge: any,
    docket: CourtListenerDocket,
    filingDate: string,
    docketHash: string | null,
    normalizedJurisdiction: string | null
  ) {
    const caseName = (docket.case_name || docket.case_name_short || 'Unknown Case').substring(0, 500)
    const { decisionDate, status, outcomeLabel } = determineCaseOutcomeAndStatus(docket)

    const caseType = classifyCaseTypeFromDocket(docket)
    const lastActivity = formatDate(docket.date_last_filing)
    const summary = buildCaseSummaryFromDocket(docket, filingDate, decisionDate, lastActivity)

    return {
      case_name: caseName,
      case_type: caseType,
      filing_date: filingDate,
      decision_date: decisionDate,
      status,
      outcome: outcomeLabel,
      summary,
      court_id: judge.court_id ?? null,
      courtlistener_id: docket.id ? `docket-${docket.id}` : null,
      source_url: buildCourtListenerUrl(docket.absolute_url),
      jurisdiction: normalizedJurisdiction,
      docket_hash: docketHash
    }
  }

  private async processDecisionsForJudge(
    judge: any,
    decisions: CourtListenerDecision[],
    existingDecisions: Map<string, string>,
    decisionStats: { processed: number; created: number; updated: number; duplicatesSkipped: number }
  ) {
    const jurisdiction = normalizeJurisdiction(judge.jurisdiction || null)
    for (const decision of decisions) {
      await this.handleSingleDecision(judge, decision, existingDecisions, decisionStats, jurisdiction)
    }
  }

  private async handleSingleDecision(
    judge: any,
    decision: CourtListenerDecision,
    existingDecisions: Map<string, string>,
    decisionStats: { processed: number; created: number; updated: number; duplicatesSkipped: number },
    jurisdiction: string | null
  ) {
    const decisionKey = getDecisionKey(decision)
    try {
      if (decisionKey && existingDecisions.has(decisionKey)) {
        const existingCaseId = existingDecisions.get(decisionKey)
        if (existingCaseId) {
          await ensureOpinionForCaseExternal(this.supabase, this.courtListener, existingCaseId, decision)
          decisionStats.updated++
        } else {
          decisionStats.duplicatesSkipped++
        }
        return
      }

      const caseResult = await this.repository.upsertDecision(judge.id, jurisdiction, decision)
      if (caseResult.caseId) {
        await ensureOpinionForCaseExternal(this.supabase, this.courtListener, caseResult.caseId, decision)
        if (decisionKey) existingDecisions.set(decisionKey, caseResult.caseId)
      }

      if (caseResult.created) {
        decisionStats.created++
      } else if (caseResult.caseId) {
        decisionStats.updated++
      } else {
        decisionStats.duplicatesSkipped++
      }

    } catch (error) {
      logger.error('Failed to process decision', { judge: judge.name, decision: decision.case_name, error })
    }
  }

  /**
   * Create a new decision record
   */
  // moved to DecisionRepository

  /**
   * Ensure we have opinion text stored for a given case
   */
  // moved to decision-opinions

  /**
   * Update judge's total case count
   */
  // moved to DecisionRepository

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
