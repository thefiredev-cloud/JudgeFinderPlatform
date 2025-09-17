/**
 * Decision Data Synchronization Module
 * Handles automated syncing of judicial decisions from CourtListener API
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CourtListenerClient } from '@/lib/courtlistener/client'
import { logger } from '@/lib/utils/logger'
import { sleep } from '@/lib/utils/helpers'

interface DecisionSyncOptions {
  batchSize?: number
  jurisdiction?: string
  daysSinceLast?: number
  judgeIds?: string[]
  maxDecisionsPerJudge?: number
  yearsBack?: number
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
  opinion_id?: number
}

export class DecisionSyncManager {
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
      const decisionKeys = decisions
        .map(decision => this.getDecisionKey(decision))
        .filter(Boolean) as string[]
      const existingDecisions = await this.getExistingDecisions(judge.id, decisionKeys)

      // Process new decisions
      for (const decision of decisions) {
        const decisionKey = this.getDecisionKey(decision)

        try {
          if (decisionKey && existingDecisions.has(decisionKey)) {
            const existingCaseId = existingDecisions.get(decisionKey)
            if (existingCaseId) {
              await this.ensureOpinionForCase(existingCaseId, decision)
              result.updated++
            } else {
              result.duplicatesSkipped++
            }
            continue
          }

          const caseResult = await this.createOrUpdateDecision(judge.id, decision)
          if (caseResult.caseId) {
            await this.ensureOpinionForCase(caseResult.caseId, decision)
            if (decisionKey) {
              existingDecisions.set(decisionKey, caseResult.caseId)
            }
          }

          if (caseResult.created) {
            result.created++
          } else if (caseResult.caseId) {
            result.updated++
          } else {
            result.duplicatesSkipped++
          }

        } catch (error) {
          logger.error('Failed to process decision', { 
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
      throw error
    }
  }

  /**
   * Get existing decisions to avoid duplicates
   */
  private async getExistingDecisions(judgeId: string, courtlistenerIds: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>()
    if (courtlistenerIds.length === 0) return map

    const { data, error } = await this.supabase
      .from('cases')
      .select('id, courtlistener_id')
      .eq('judge_id', judgeId)
      .in('courtlistener_id', courtlistenerIds)

    if (error) {
      logger.error('Failed to get existing decisions', { error })
      return map
    }

    for (const row of data || []) {
      if (row.courtlistener_id && row.id) {
        map.set(row.courtlistener_id, row.id)
      }
    }

    return map
  }

  /**
   * Create a new decision record
   */
  private async createOrUpdateDecision(judgeId: string, decision: CourtListenerDecision): Promise<{ caseId: string | null; created: boolean }> {
    const decisionKey = this.getDecisionKey(decision)
    const caseRecord = {
      judge_id: judgeId,
      case_name: (decision.case_name || 'Unknown Case').substring(0, 500),
      case_number: `CL-${decision.cluster_id}`,
      decision_date: decision.date_filed,
      filing_date: decision.date_filed,
      case_type: 'Opinion',
      status: 'decided' as const,
      outcome: decision.precedential_status || null,
      summary: decision.case_name ? `CourtListener opinion for ${decision.case_name}` : `CourtListener opinion ${decisionKey}`,
      courtlistener_id: decisionKey,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('cases')
      .insert(caseRecord)
      .select('id')
      .single()

    if (!error) {
      return { caseId: data?.id || null, created: true }
    }

    if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
      logger.warn('Decision already exists', { judgeId, caseNumber: caseRecord.case_number })
      const { data: existingCase } = await this.supabase
        .from('cases')
        .select('id')
        .eq('judge_id', judgeId)
        .eq('courtlistener_id', decisionKey)
        .maybeSingle()

      return { caseId: existingCase?.id || null, created: false }
    }

    throw new Error(`Failed to create decision: ${error.message}`)
  }

  /**
   * Ensure we have opinion text stored for a given case
   */
  private async ensureOpinionForCase(caseId: string, decision: CourtListenerDecision) {
    const opinionId = decision.opinion_id ?? decision.id
    if (!opinionId) return

    try {
      const { data: existingOpinion } = await this.supabase
        .from('opinions')
        .select('id')
        .eq('case_id', caseId)
        .eq('courtlistener_id', opinionId.toString())
        .maybeSingle()

      if (existingOpinion) {
        return
      }

      const opinionDetail = await this.courtListener.getOpinionDetail(opinionId)
      const plainText = opinionDetail?.plain_text
        || (opinionDetail?.html ? this.stripHtml(opinionDetail.html) : null)
        || (opinionDetail?.html_with_citations ? this.stripHtml(opinionDetail.html_with_citations) : null)

      if (!plainText) {
        logger.warn('Opinion detail missing text', { opinionId })
        return
      }

      const opinionRecord = {
        case_id: caseId,
        cluster_id: opinionDetail?.cluster?.toString() || decision.cluster_id?.toString() || null,
        opinion_type: opinionDetail?.type || 'lead',
        author_judge_id: null,
        author_name: opinionDetail?.author_str || decision.author_str || null,
        per_curiam: opinionDetail?.per_curiam ?? false,
        opinion_text: plainText,
        html_text: opinionDetail?.html || null,
        plain_text: plainText,
        courtlistener_id: opinionId.toString(),
        date_created: opinionDetail?.date_created || decision.date_filed || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('opinions')
        .upsert(opinionRecord, { onConflict: 'courtlistener_id' })

      if (error) {
        logger.error('Failed to upsert opinion', { error, opinionId })
      }

    } catch (error) {
      logger.error('Failed to fetch opinion detail', { opinionId, error })
    }
  }

  /**
   * Update judge's total case count
   */
  private async updateJudgeCaseCount(judgeId: string) {
    try {
      const { count, error } = await this.supabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('judge_id', judgeId)
        .eq('status', 'decided')

      if (error) {
        logger.error('Failed to count cases for judge', { judgeId, error })
        return
      }

      await this.supabase
        .from('judges')
        .update({ 
          total_cases: count ?? 0,
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

  private getDecisionKey(decision: CourtListenerDecision): string {
    if (decision.opinion_id) return decision.opinion_id.toString()
    if (decision.id) return decision.id.toString()
    if (decision.cluster_id) return `cluster-${decision.cluster_id}`
    return `decision-${Date.now()}`
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
}
