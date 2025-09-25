import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export interface EnvironmentCheckResult {
  timestamp: string
  runtime: string
  nodeEnv: string | undefined
  environmentVariables: {
    found: string[]
    missing: string[]
    values: Record<string, string>
  }
  supabaseConnection: SupabaseConnectionResult
  databaseCounts: DatabaseCountsResult
  netlifyContext: string | null
}

export interface SupabaseConnectionResult {
  urlPresent: boolean
  anonKeyPresent: boolean
  serviceKeyPresent: boolean
  urlFormatValid: boolean
  connectionTest: {
    success: boolean
    error?: string
  }
}

export interface DatabaseCountsResult {
  judges: number | null
  courts: number | null
  cases: number | null
  error?: string
}

const EXPECTED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'COURTLISTENER_API_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'NODE_ENV',
  'VERCEL_ENV',
  'NETLIFY',
  'CONTEXT',
]

export class DebugEnvManager {
  async gatherEnvironmentStatus(): Promise<EnvironmentCheckResult> {
    const supabase = await this.createSupabaseClient()
    const supabaseConnection = this.evaluateSupabaseCredentials()

    if (supabase && supabaseConnection.connectionTest.success) {
      const counts = await this.collectDatabaseCounts(supabase)
      supabaseConnection.connectionTest.success = counts.success
      supabaseConnection.connectionTest.error = counts.error ?? supabaseConnection.connectionTest.error
      return this.buildResult(supabaseConnection, counts)
    }

    return this.buildResult(supabaseConnection, { judges: null, courts: null, cases: null, error: supabaseConnection.connectionTest.error })
  }

  private buildResult(
    supabaseConnection: SupabaseConnectionResult,
    counts: DatabaseCountsResult & { success?: boolean }
  ): EnvironmentCheckResult {
    const environmentVariables = this.inspectEnvironmentVariables()
    const netlifyContext = process.env.NETLIFY === 'true' || process.env.CONTEXT ? process.env.CONTEXT ?? 'unknown' : null

    return {
      timestamp: new Date().toISOString(),
      runtime: this.resolveRuntime(netlifyContext),
      nodeEnv: process.env.NODE_ENV,
      environmentVariables,
      supabaseConnection,
      databaseCounts: {
        judges: counts.judges,
        courts: counts.courts,
        cases: counts.cases,
        error: counts.error,
      },
      netlifyContext,
    }
  }

  private resolveRuntime(netlifyContext: string | null): string {
    if (netlifyContext) {
      return `Netlify (${netlifyContext})`
    }
    return typeof process !== 'undefined' ? 'Node.js' : 'Edge'
  }

  private inspectEnvironmentVariables(): EnvironmentCheckResult['environmentVariables'] {
    const found: string[] = []
    const missing: string[] = []
    const values: Record<string, string> = {}

    for (const name of EXPECTED_ENV_VARS) {
      const value = process.env[name]
      if (value) {
        found.push(name)
        values[name] = this.maskEnvironmentValue(name, value)
      } else {
        missing.push(name)
      }
    }

    return { found, missing, values }
  }

  private maskEnvironmentValue(name: string, value: string): string {
    if (name.includes('KEY') || name.includes('SECRET') || name.includes('TOKEN')) {
      return '***REDACTED***'
    }

    if (name.includes('URL')) {
      try {
        const url = new URL(value)
        return `${url.protocol}//${url.hostname}/***`
      } catch {
        return '***INVALID_URL***'
      }
    }

    return value
  }

  private evaluateSupabaseCredentials(): SupabaseConnectionResult {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

    const result: SupabaseConnectionResult = {
      urlPresent: Boolean(supabaseUrl),
      anonKeyPresent: Boolean(anonKey),
      serviceKeyPresent: Boolean(serviceKey),
      urlFormatValid: Boolean(supabaseUrl && supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co')),
      connectionTest: {
        success: Boolean(supabaseUrl && serviceKey),
      },
    }

    if (!result.connectionTest.success) {
      result.connectionTest.error = 'Missing required credentials'
    }

    return result
  }

  private async createSupabaseClient(): Promise<SupabaseClient | null> {
    const connection = this.evaluateSupabaseCredentials()
    if (!connection.connectionTest.success) {
      return null
    }

    try {
      return await createServerClient()
    } catch (serverError) {
      logger.warn('Supabase server client failed in debug manager, falling back to direct connection', { error: serverError })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    try {
      return createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    } catch (fallbackError) {
      logger.error('Supabase fallback client initialization failed', { error: fallbackError })
      return null
    }
  }

  private async collectDatabaseCounts(client: SupabaseClient): Promise<DatabaseCountsResult & { success: boolean }> {
    try {
      const [judges, courts, cases] = await Promise.all([
        this.countRows(client, 'judges'),
        this.countRows(client, 'courts'),
        this.countRows(client, 'cases'),
      ])

      return {
        success: true,
        judges,
        courts,
        cases,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        judges: null,
        courts: null,
        cases: null,
        error: message,
      }
    }
  }

  private async countRows(client: SupabaseClient, table: string): Promise<number> {
    const { count, error } = await client.from(table).select('*', { count: 'exact', head: true })
    if (error) {
      throw new Error(error.message)
    }
    return count ?? 0
  }
}

