import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { SupabaseConnectionHelper } from '@/lib/supabase/connection-helper'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      memory: 'unknown',
      disk: 'unknown',
    },
    performance: {
      responseTime: 0,
    } as any,
  }

  try {
    const { buildRateLimiter, getClientIp } = await import('@/lib/security/rate-limit')
    const rl = buildRateLimiter({ tokens: 60, window: '1 m', prefix: 'api:health' })
    const { success, remaining } = await rl.limit(`${getClientIp(request)}:global`)
    if (!success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    // Check database connectivity using connection helper
    const connectionHelper = SupabaseConnectionHelper.getInstance()
    const healthCheck = await connectionHelper.healthCheck()

    if (healthCheck.status === 'healthy') {
      checks.checks.database = 'healthy'
    } else if (healthCheck.status === 'degraded') {
      checks.checks.database = 'degraded'
      checks.status = 'degraded'
    } else {
      checks.checks.database = 'unhealthy'
      checks.status = 'degraded'
    }

    // Add database performance metrics
    checks.performance = {
      ...checks.performance,
      databaseLatency: healthCheck.checks.latency,
      databaseConnection: healthCheck.checks.connection,
      databaseQuery: healthCheck.checks.query
    }

    if (healthCheck.error) {
      checks.performance.databaseError = healthCheck.error
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage()
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
    const memoryLimitMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
    
    checks.checks.memory = memoryUsageMB < 500 ? 'healthy' : 'warning'
    
    // Add detailed memory info
    checks.performance = {
      ...checks.performance,
      memoryUsage: {
        used: memoryUsageMB,
        total: memoryLimitMB,
        percentage: Math.round((memoryUsageMB / memoryLimitMB) * 100),
      },
    }

    // Simple disk check (in a real scenario, you'd check actual disk usage)
    checks.checks.disk = 'healthy'

    // Calculate response time
    checks.performance.responseTime = Date.now() - startTime

    // Determine overall status
    const unhealthyChecks = Object.values(checks.checks).filter(status => status === 'unhealthy')
    const warningChecks = Object.values(checks.checks).filter(status => status === 'warning')
    
    if (unhealthyChecks.length > 0) {
      checks.status = 'unhealthy'
    } else if (warningChecks.length > 0) {
      checks.status = 'warning'
    } else {
      checks.status = 'healthy'
    }

    // Return appropriate HTTP status code
    const httpStatus = checks.status === 'healthy' ? 200 : checks.status === 'warning' ? 200 : 503

    return NextResponse.json({ ...checks, rate_limit_remaining: remaining }, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      }
    })

  } catch (error) {
    console.error('Health check error:', error)
    
    checks.status = 'unhealthy'
    checks.checks.database = 'unhealthy'
    checks.performance.responseTime = Date.now() - startTime
    
    return NextResponse.json({
      ...checks,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      }
    })
  }
}