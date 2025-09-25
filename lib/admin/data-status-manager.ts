import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import type { Judge, Court, Case } from '@/types'

interface JudgeTableMetrics {
  total: number
  withDecisions: number
  withAnalytics: number
  lastUpdated: string | null
}

interface CourtTableMetrics {
  total: number
  withJudges: number
  lastUpdated: string | null
}

interface CaseTableMetrics {
  total: number
  decided: number
  pending: number
  lastUpdated: string | null
}

interface AnalyticsTableMetrics {
  cached: number
  lastGenerated: string | null
}

export interface DatabaseStatusTables {
  judges: JudgeTableMetrics
  courts: CourtTableMetrics
  cases: CaseTableMetrics
  analytics: AnalyticsTableMetrics
}

export interface DatabaseStatusSnapshot {
  connected: boolean
  tables: DatabaseStatusTables
}

const DEFAULT_TABLES: DatabaseStatusTables = {
  judges: {
    total: 0,
    withDecisions: 0,
    withAnalytics: 0,
    lastUpdated: null,
  },
  courts: {
    total: 0,
    withJudges: 0,
    lastUpdated: null,
  },
  cases: {
    total: 0,
    decided: 0,
    pending: 0,
    lastUpdated: null,
  },
  analytics: {
    cached: 0,
    lastGenerated: null,
  },
}

type FilterBuilder = PostgrestFilterBuilder<any, any, any[], unknown, unknown>

export class DataStatusManager {
  private constructor(private readonly supabase: SupabaseClient) {}

  static async initialize(): Promise<DataStatusManager | null> {
    const client = await createSupabaseClientWithFallback()
    return client ? new DataStatusManager(client) : null
  }

  async buildSnapshot(): Promise<DatabaseStatusSnapshot> {
    const tables: DatabaseStatusTables = JSON.parse(JSON.stringify(DEFAULT_TABLES))
    let connected = false

    const judgeMetrics = await this.safeFetch(() => this.fetchJudgeMetrics(), 'judges')
    if (judgeMetrics) {
      tables.judges = judgeMetrics
      connected = true
    }

    const courtMetrics = await this.safeFetch(() => this.fetchCourtMetrics(), 'courts')
    if (courtMetrics) {
      tables.courts = courtMetrics
      connected = true
    }

    const caseMetrics = await this.safeFetch(() => this.fetchCaseMetrics(), 'cases')
    if (caseMetrics) {
      tables.cases = caseMetrics
      connected = true
    }

    const analyticsMetrics = await this.safeFetch(() => this.fetchAnalyticsMetrics(), 'analytics cache')
    if (analyticsMetrics) {
      tables.analytics = analyticsMetrics
      tables.judges.withAnalytics = Math.min(analyticsMetrics.cached, tables.judges.total)
      connected = true
    }

    return { connected, tables }
  }

  private async fetchJudgeMetrics(): Promise<JudgeTableMetrics> {
    const total = await this.countRows('judges')
    const withDecisions = await this.countRows('judges', (query) => query.gt('total_cases', 0))
    const lastUpdated = await this.fetchLatestTimestamp<Pick<Judge, 'updated_at'>>('judges', 'updated_at')
    return {
      total,
      withDecisions,
      withAnalytics: 0,
      lastUpdated,
    }
  }

  private async fetchCourtMetrics(): Promise<CourtTableMetrics> {
    const total = await this.countRows('courts')
    const withJudges = await this.countRows('courts', (query) => query.gt('judge_count', 0))
    const lastUpdated = await this.fetchLatestTimestamp<Pick<Court, 'updated_at'>>('courts', 'updated_at')
    return {
      total,
      withJudges,
      lastUpdated,
    }
  }

  private async fetchCaseMetrics(): Promise<CaseTableMetrics> {
    const total = await this.countRows('cases')
    const decided = await this.countRows('cases', (query) => query.eq('status', 'decided'))
    const pending = await this.countRows('cases', (query) => query.eq('status', 'pending'))
    const lastUpdated = await this.fetchLatestTimestamp<Pick<Case, 'filing_date'>>('cases', 'filing_date')
    return {
      total,
      decided,
      pending,
      lastUpdated,
    }
  }

  private async fetchAnalyticsMetrics(): Promise<AnalyticsTableMetrics> {
    const cached = await this.countRows('judge_analytics_cache')
    const lastGenerated = await this.fetchLatestTimestamp<{ created_at: string | null }>('judge_analytics_cache', 'created_at')
    return {
      cached,
      lastGenerated,
    }
  }

  private async countRows(
    table: string,
    applyFilter?: (query: FilterBuilder) => FilterBuilder
  ): Promise<number> {
    const baseQuery = this.supabase.from(table).select('*', { count: 'exact', head: true })
    const filteredQuery = applyFilter ? applyFilter(baseQuery) : baseQuery
    const { count, error } = await filteredQuery
    if (error) {
      throw new Error(error.message)
    }
    return count ?? 0
  }

  private async fetchLatestTimestamp<T extends Record<string, string | null>>(
    table: string,
    column: keyof T & string
  ): Promise<string | null> {
    const { data, error } = await this.supabase
      .from(table)
      .select(column)
      .order(column, { ascending: false })
      .limit(1)
      .maybeSingle<T>()

    if (error) {
      throw new Error(error.message)
    }

    return data ? data[column] ?? null : null
  }

  private async safeFetch<T>(task: () => Promise<T>, context: string): Promise<T | null> {
    try {
      return await task()
    } catch (error) {
      logger.error(`Failed to fetch ${context} metrics`, { error })
      return null
    }
  }
}

async function createSupabaseClientWithFallback(): Promise<SupabaseClient | null> {
  try {
    return await createServerClient()
  } catch (serverError) {
    logger.error('Supabase server client initialization failed', { error: serverError })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    logger.error('Missing Supabase credentials for fallback connection')
    return null
  }

  try {
    return createClient(url, serviceKey, { auth: { persistSession: false } })
  } catch (fallbackError) {
    logger.error('Supabase direct client initialization failed', { error: fallbackError })
    return null
  }
}

