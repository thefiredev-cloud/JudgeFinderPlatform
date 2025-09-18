/**
 * Decision Data Synchronization Module
 * Handles automated syncing of judicial decisions from CourtListener API
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { CourtListenerClient, type CourtListenerDocket } from '@/lib/courtlistener/client'
import { logger } from '@/lib/utils/logger'
import { sleep } from '@/lib/utils/helpers'

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
          .map(decision => this.getDecisionKey(decision))
          .filter(Boolean) as string[]
        const existingDecisions = await this.getExistingDecisions(judge.id, decisionKeys)

        for (const decision of decisions) {
          const decisionKey = this.getDecisionKey(decision)

          try {
            if (decisionKey && existingDecisions.has(decisionKey)) {
              const existingCaseId = existingDecisions.get(decisionKey)
              if (existingCaseId) {
                await this.ensureOpinionForCase(existingCaseId, decision)
                decisionStats.updated++
              } else {
                decisionStats.duplicatesSkipped++
              }
              continue
            }

            const caseResult = await this.createOrUpdateDecision(judge.id, judge.jurisdiction || null, decision)
            if (caseResult.caseId) {
              await this.ensureOpinionForCase(caseResult.caseId, decision)
              if (decisionKey) {
                existingDecisions.set(decisionKey, caseResult.caseId)
              }
            }

            if (caseResult.created) {
              decisionStats.created++
            } else if (caseResult.caseId) {
              decisionStats.updated++
            } else {
              decisionStats.duplicatesSkipped++
            }

          } catch (error) {
            logger.error('Failed to process decision', {
              judge: judge.name,
              decision: decision.case_name,
              error
            })
          }
        }
      }

      if (options.includeDockets !== false) {
        filingStats = await this.syncJudgeFilings(judge, options)
      }

      // Update judge's total case count after decisions and filings
      await this.updateJudgeCaseCount(judge.id)

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
  private async getSinceDateForFilings(judgeId: string, options: DecisionSyncOptions): Promise<string> {
    if (options.filingDaysSinceLast) {
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - options.filingDaysSinceLast)
      return daysAgo.toISOString().split('T')[0]
    }

    const { data, error } = await this.supabase
      .from('cases')
      .select('filing_date')
      .eq('judge_id', judgeId)
      .not('filing_date', 'is', null)
      .order('filing_date', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      const yearsBack = options.filingYearsBack ?? options.yearsBack ?? 5
      const fallback = new Date()
      fallback.setFullYear(fallback.getFullYear() - yearsBack)
      return fallback.toISOString().split('T')[0]
    }

    const lastDate = new Date(data.filing_date)
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
   * Sync docket filings for a judge
   */
  private async syncJudgeFilings(judge: any, options: DecisionSyncOptions) {
    const stats = {
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0
    }

    try {
      if (!judge.courtlistener_id) {
        return stats
      }

      const sinceDate = await this.getSinceDateForFilings(judge.id, options)
      const yearsBack = options.filingYearsBack ?? options.yearsBack ?? 5
      const maxRecords = options.maxFilingsPerJudge ?? 300

      const filings = await this.courtListener.getRecentDocketsByJudge(judge.courtlistener_id, {
        startDate: sinceDate,
        yearsBack,
        maxRecords
      })

      stats.processed = filings.length

      if (filings.length === 0) {
        return stats
      }

      const normalizedCaseNumbers = Array.from(
        new Set(
          filings
            .map(filing => this.normalizeCaseNumber(filing))
            .filter((value): value is string => Boolean(value))
        )
      )

      const existingFilings = await this.getExistingFilings(judge.id, normalizedCaseNumbers)

      for (const docket of filings) {
        const caseNumber = this.normalizeCaseNumber(docket)
        const filingDate = this.formatDate(docket.date_filed)

        if (!caseNumber || !filingDate) {
          stats.skipped++
          continue
        }

        const record = this.buildCaseRecordFromDocket(judge, docket, filingDate)
        const existing = existingFilings.get(caseNumber)

        if (existing) {
          const { error: updateError } = await this.supabase
            .from('cases')
            .update(record)
            .eq('id', existing.id)

          if (updateError) {
            logger.error('Failed to update existing filing', {
              judgeId: judge.id,
              caseNumber,
              error: updateError
            })
            stats.skipped++
            continue
          }

          stats.updated++
        } else {
          const insertRecord = {
            ...record,
            judge_id: judge.id,
            case_number: caseNumber,
            court_id: record.court_id ?? judge.court_id ?? null
          }

          const { error: insertError } = await this.supabase
            .from('cases')
            .upsert(insertRecord, { onConflict: 'case_number,jurisdiction' })

          if (insertError) {
            logger.error('Failed to insert filing', {
              judgeId: judge.id,
              caseNumber,
              error: insertError
            })
            stats.skipped++
            continue
          }

          stats.created++
        }
      }

      return stats

    } catch (error) {
      logger.error('Failed to sync docket filings for judge', {
        judgeId: judge.id,
        judgeName: judge.name,
        error
      })
      return stats
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
   * Get existing filings for a judge by case number
   */
  private async getExistingFilings(judgeId: string, caseNumbers: string[]): Promise<Map<string, { id: string }>> {
    const map = new Map<string, { id: string }>()

    if (!caseNumbers || caseNumbers.length === 0) {
      return map
    }

    const { data, error } = await this.supabase
      .from('cases')
      .select('id, case_number')
      .eq('judge_id', judgeId)
      .in('case_number', caseNumbers)

    if (error) {
      logger.error('Failed to get existing filings', { error, judgeId })
      return map
    }

    for (const row of data || []) {
      if (row.case_number && row.id) {
        map.set(row.case_number, { id: row.id })
      }
    }

    return map
  }

  private buildCaseRecordFromDocket(judge: any, docket: CourtListenerDocket, filingDate: string) {
    const caseName = (docket.case_name || docket.case_name_short || 'Unknown Case').substring(0, 500)
    const decisionDate = this.formatDate(docket.date_terminated) || this.formatDate(docket.date_last_filing)
    const status = decisionDate ? 'decided' as const : 'pending' as const
    const caseType = this.classifyCaseTypeFromDocket(docket)
    const outcome = docket.status
      ? this.toTitleCase(docket.status)
      : decisionDate
        ? 'Closed'
        : 'Active'
    const lastActivity = this.formatDate(docket.date_last_filing)
    const summary = this.buildCaseSummaryFromDocket(docket, filingDate, decisionDate, lastActivity)

    return {
      case_name: caseName,
      case_type: caseType,
      filing_date: filingDate,
      decision_date: decisionDate,
      status,
      outcome,
      summary,
      court_id: judge.court_id ?? null,
      courtlistener_id: docket.id ? `docket-${docket.id}` : null,
      source_url: this.buildCourtListenerUrl(docket.absolute_url),
      jurisdiction: judge.jurisdiction || null
    }
  }

  private classifyCaseTypeFromDocket(docket: CourtListenerDocket): string {
    const nature = (docket.nature_of_suit || '').toLowerCase()
    const jurisdiction = (docket.jurisdiction_type || '').toLowerCase()
    const caseName = (docket.case_name || docket.case_name_short || '').toLowerCase()

    if (jurisdiction.includes('criminal') || nature.includes('criminal') || caseName.includes('people v')) {
      return 'Criminal'
    }
    if (
      jurisdiction.includes('family') ||
      nature.includes('domestic') ||
      nature.includes('family') ||
      caseName.includes('marriage') ||
      caseName.includes('custody')
    ) {
      return 'Family Law'
    }
    if (nature.includes('probate') || caseName.includes('estate')) {
      return 'Probate'
    }
    if (nature.includes('bankruptcy') || caseName.includes('bankruptcy')) {
      return 'Bankruptcy'
    }
    if (nature.includes('tax') || jurisdiction.includes('tax')) {
      return 'Tax'
    }
    if (nature.includes('labor') || nature.includes('employment')) {
      return 'Employment'
    }
    if (jurisdiction.includes('appeal') || caseName.includes('appeal')) {
      return 'Appeals'
    }
    if (nature.includes('traffic')) {
      return 'Traffic'
    }
    if (nature.includes('immigration') || caseName.includes('immigration')) {
      return 'Immigration'
    }
    if (nature.includes('insurance')) {
      return 'Insurance'
    }

    if (jurisdiction.includes('civil') || nature.includes('civil')) {
      return 'Civil Litigation'
    }

    return 'General Litigation'
  }

  private buildCaseSummaryFromDocket(
    docket: CourtListenerDocket,
    filingDate: string,
    decisionDate: string | null,
    lastActivity: string | null
  ): string | null {
    const parts: string[] = []

    parts.push(`Filed ${filingDate}`)

    if (decisionDate) {
      parts.push(`Closed ${decisionDate}`)
    } else if (lastActivity && lastActivity !== filingDate) {
      parts.push(`Last activity ${lastActivity}`)
    }

    if (docket.nature_of_suit) {
      parts.push(`Nature: ${docket.nature_of_suit}`)
    }

    if (docket.jurisdiction_type) {
      parts.push(`Jurisdiction: ${this.toTitleCase(docket.jurisdiction_type)}`)
    }

    if (typeof docket.docket_entries_count === 'number' && docket.docket_entries_count > 0) {
      parts.push(`Entries: ${docket.docket_entries_count}`)
    }

    if (docket.assigned_to_str) {
      parts.push(`Assigned: ${docket.assigned_to_str}`)
    }

    if (parts.length === 0) {
      return null
    }

    return parts.join(' | ').substring(0, 500)
  }

  private normalizeCaseNumber(docket: CourtListenerDocket): string | null {
    const raw = docket.docket_number || docket.pacer_case_id

    if (raw && raw.trim().length > 0) {
      return raw.trim().slice(0, 100)
    }

    if (docket.id) {
      return `CL-DKT-${docket.id}`.slice(0, 100)
    }

    return null
  }

  private formatDate(value?: string | null): string | null {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return null
    }
    return date.toISOString().split('T')[0]
  }

  private buildCourtListenerUrl(absoluteUrl?: string | null): string | null {
    if (!absoluteUrl) return null
    if (absoluteUrl.startsWith('http')) {
      return absoluteUrl
    }
    return `https://www.courtlistener.com${absoluteUrl}`
  }

  private toTitleCase(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/(^|\s)\w/g, match => match.toUpperCase())
  }

  /**
   * Create a new decision record
   */
  private async createOrUpdateDecision(judgeId: string, jurisdiction: string | null, decision: CourtListenerDecision): Promise<{ caseId: string | null; created: boolean }> {
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
      jurisdiction: jurisdiction,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('cases')
      .upsert(caseRecord, { onConflict: 'case_number,jurisdiction' })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to upsert decision: ${error.message}`)
    }

    return { caseId: data?.id || null, created: true }
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
