import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/auth/is-admin'
import { logger } from '@/lib/utils/logger'
import { validateEnvironment, type EnvValidationResult } from '@/lib/utils/env-validator'
import { DataStatusManager, type DatabaseStatusSnapshot } from '@/lib/admin/data-status-manager'
import type { DatabaseStatusTables } from '@/lib/admin/data-status-manager'

export const dynamic = 'force-dynamic'

interface ErrorResponse {
  error: string
  message: string
}

interface DataStatusResponse {
  status: 'healthy' | 'partial' | 'empty' | 'error'
  timestamp: string
  environment: {
    valid: boolean
    warnings: string[]
  }
  database: {
    connected: boolean
    tables: {
      judges: {
        total: number
        withDecisions: number
        withAnalytics: number
        lastUpdated: string | null
      }
      courts: {
        total: number
        withJudges: number
        lastUpdated: string | null
      }
      cases: {
        total: number
        decided: number
        pending: number
        lastUpdated: string | null
      }
      analytics: {
        cached: number
        lastGenerated: string | null
      }
    }
  }
  recommendations: string[]
}

export async function GET(request: NextRequest): Promise<NextResponse<DataStatusResponse | ErrorResponse>> {
  const startTime = Date.now()

  try {
    await ensureAdminAccess()
    logger.apiRequest('GET', '/api/admin/data-status')

    const environmentValidation = safelyValidateEnvironment()
    const response = createBaseResponse(environmentValidation)

    const manager = await DataStatusManager.initialize()
    if (manager) {
      const snapshot = await manager.buildSnapshot()
      applyDatabaseSnapshot(response, snapshot)
    } else {
      appendRecommendation(response, 'Unable to create database connection. Check environment variables.')
    }

    evaluateDatabaseHealth(response)
    appendDataRecommendations(response)
    appendFreshnessWarnings(response)

    const duration = Date.now() - startTime
    const tables = response.database.tables
    logger.apiResponse('GET', '/api/admin/data-status', 200, duration, {
      status: response.status,
      judgeCount: tables.judges.total,
      courtCount: tables.courts.total,
      caseCount: tables.cases.total,
    })

    return NextResponse.json(response)
  } catch (error) {
    const duration = Date.now() - startTime
    const errorPayload = error instanceof Error ? error : undefined
    logger.error('API error in data status', { duration }, errorPayload)
    logger.apiResponse('GET', '/api/admin/data-status', 500, duration)

    return NextResponse.json<ErrorResponse>({
      error: 'Internal server error',
      message: errorPayload?.message ?? 'Unknown error',
    }, { status: 500 })
  }
}

async function ensureAdminAccess(): Promise<void> {
  const { userId } = await auth()
  if (!userId || !(await isAdmin())) {
    throw new Error('Forbidden')
  }
}

function safelyValidateEnvironment(): EnvValidationResult {
  try {
    return validateEnvironment()
  } catch (error) {
    logger.error('Environment validation error', { error })
    return {
      valid: false,
      warnings: ['Environment validation failed'],
      errors: ['Environment validation failed'],
      values: {},
    }
  }
}

function createBaseResponse(environmentValidation: EnvValidationResult): DataStatusResponse {
  return {
    status: 'empty',
    timestamp: new Date().toISOString(),
    environment: {
      valid: environmentValidation.valid,
      warnings: environmentValidation.warnings,
    },
    database: {
      connected: false,
      tables: cloneTables(),
    },
    recommendations: [],
  }
}

function cloneTables(): DatabaseStatusTables {
  return {
    judges: { total: 0, withDecisions: 0, withAnalytics: 0, lastUpdated: null },
    courts: { total: 0, withJudges: 0, lastUpdated: null },
    cases: { total: 0, decided: 0, pending: 0, lastUpdated: null },
    analytics: { cached: 0, lastGenerated: null },
  }
}

function applyDatabaseSnapshot(response: DataStatusResponse, snapshot: DatabaseStatusSnapshot): void {
  response.database.connected = snapshot.connected
  response.database.tables = snapshot.tables
}

function evaluateDatabaseHealth(response: DataStatusResponse): void {
  if (!response.database.connected) {
    response.status = 'error'
    appendRecommendation(response, 'Database connection failed. Check Supabase credentials.')
    return
  }

  const tables = response.database.tables
  const { total: judgeCount } = tables.judges
  const { total: courtCount } = tables.courts

  if (judgeCount === 0 && courtCount === 0) {
    response.status = 'empty'
    appendRecommendation(response, 'Database is empty. Run: npm run populate:production')
    return
  }

  if (judgeCount < 100 || courtCount < 50) {
    response.status = 'partial'
    appendRecommendation(response, 'Database has partial data. Consider running full sync.')
    return
  }

  response.status = 'healthy'
}

function appendDataRecommendations(response: DataStatusResponse): void {
  const tables = response.database.tables
  const judgeCount = tables.judges.total
  const caseCount = tables.cases.total

  if (judgeCount > 0 && caseCount === 0) {
    appendRecommendation(response, 'No cases found. Consider generating sample cases.')
  }

  if (tables.judges.withDecisions < judgeCount * 0.5) {
    appendRecommendation(response, 'Less than 50% of judges have decisions. Run decision sync.')
  }

  if (tables.analytics.cached < judgeCount * 0.5) {
    appendRecommendation(response, 'Analytics cache is incomplete. Run: npm run analytics:generate')
  }

  if (!response.environment.valid) {
    appendRecommendation(response, 'Environment variables are not properly configured.')
  }
}

function appendFreshnessWarnings(response: DataStatusResponse): void {
  const lastUpdated = response.database.tables.judges.lastUpdated
  if (!lastUpdated) {
    return
  }

  const daysSinceUpdate = calculateDaysSince(lastUpdated)
  if (daysSinceUpdate > 7) {
    appendRecommendation(response, `Judge data is ${daysSinceUpdate} days old. Consider running sync.`)
  }
}

function appendRecommendation(response: DataStatusResponse, message: string): void {
  if (!response.recommendations.includes(message)) {
    response.recommendations.push(message)
  }
}

function calculateDaysSince(timestamp: string): number {
  const msPerDay = 1000 * 60 * 60 * 24
  const lastUpdate = new Date(timestamp)
  return Math.floor((Date.now() - lastUpdate.getTime()) / msPerDay)
}