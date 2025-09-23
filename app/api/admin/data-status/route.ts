import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/auth/is-admin'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'
import { validateEnvironment } from '@/lib/utils/env-validator'

export const dynamic = 'force-dynamic'

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

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { userId } = await auth()
    if (!userId || !(await isAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.apiRequest('GET', '/api/admin/data-status')
    
    // Validate environment (but don't fail if invalid)
    let envValidation: any = { valid: false, warnings: [], errors: [] }
    try {
      envValidation = validateEnvironment()
    } catch (error) {
      console.error('Environment validation error:', error)
      envValidation.errors.push('Environment validation failed')
    }
    
    const response: DataStatusResponse = {
      status: 'empty',
      timestamp: new Date().toISOString(),
      environment: {
        valid: envValidation.valid,
        warnings: envValidation.warnings
      },
      database: {
        connected: false,
        tables: {
          judges: {
            total: 0,
            withDecisions: 0,
            withAnalytics: 0,
            lastUpdated: null
          },
          courts: {
            total: 0,
            withJudges: 0,
            lastUpdated: null
          },
          cases: {
            total: 0,
            decided: 0,
            pending: 0,
            lastUpdated: null
          },
          analytics: {
            cached: 0,
            lastGenerated: null
          }
        }
      },
      recommendations: []
    }
    
    // Check database connection
    let supabase: any = null
    
    // Try server client first
    try {
      supabase = await createServerClient()
    } catch (serverError) {
      console.error('Server client failed, trying direct connection:', serverError)
      
      // Fallback to direct connection
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (url && serviceKey) {
        try {
          supabase = createClient(url, serviceKey, {
            auth: { persistSession: false }
          })
          console.log('Direct connection established')
        } catch (directError) {
          console.error('Direct connection also failed:', directError)
        }
      }
    }
    
    if (supabase) {
      try {
      
      // Check judges
      const { count: judgeCount, error: judgeError } = await supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })
      
      if (!judgeError) {
        response.database.connected = true
        response.database.tables.judges.total = judgeCount || 0
        
        // Check judges with decisions
        const { count: judgesWithDecisions } = await supabase
          .from('judges')
          .select('*', { count: 'exact', head: true })
          .gt('total_cases', 0)
        
        response.database.tables.judges.withDecisions = judgesWithDecisions || 0
        
        // Get last updated
        const { data: lastJudge } = await supabase
          .from('judges')
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()
        
        if (lastJudge) {
          response.database.tables.judges.lastUpdated = lastJudge.updated_at
        }
      }
      
      // Check courts
      const { count: courtCount, error: courtError } = await supabase
        .from('courts')
        .select('*', { count: 'exact', head: true })
      
      if (!courtError) {
        response.database.tables.courts.total = courtCount || 0
        
        // Check courts with judges
        const { count: courtsWithJudges } = await supabase
          .from('courts')
          .select('*', { count: 'exact', head: true })
          .gt('judge_count', 0)
        
        response.database.tables.courts.withJudges = courtsWithJudges || 0
        
        // Get last updated
        const { data: lastCourt } = await supabase
          .from('courts')
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()
        
        if (lastCourt) {
          response.database.tables.courts.lastUpdated = lastCourt.updated_at
        }
      }
      
      // Check cases
      const { count: caseCount, error: caseError } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
      
      if (!caseError) {
        response.database.tables.cases.total = caseCount || 0
        
        // Check decided vs pending
        const { count: decidedCount } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'decided')
        
        const { count: pendingCount } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
        
        response.database.tables.cases.decided = decidedCount || 0
        response.database.tables.cases.pending = pendingCount || 0
        
        // Get last updated
        const { data: lastCase } = await supabase
          .from('cases')
          .select('filing_date')
          .order('filing_date', { ascending: false })
          .limit(1)
          .single()
        
        if (lastCase) {
          response.database.tables.cases.lastUpdated = lastCase.filing_date
        }
      }
      
      // Check analytics cache
      const { count: analyticsCount } = await supabase
        .from('judge_analytics_cache')
        .select('*', { count: 'exact', head: true })
      
      if (analyticsCount) {
        response.database.tables.analytics.cached = analyticsCount
        
        // Get last generated
        const { data: lastAnalytics } = await supabase
          .from('judge_analytics_cache')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (lastAnalytics) {
          response.database.tables.analytics.lastGenerated = lastAnalytics.created_at
        }
      }
      
      } catch (dbError) {
        logger.error('Database connection error', { error: dbError })
        response.database.connected = false
      }
    } else {
      console.error('No Supabase client could be created')
      response.database.connected = false
      response.recommendations.push('Unable to create database connection. Check environment variables.')
    }
    
    // Determine overall status
    const judgeCount = response.database.tables.judges.total
    const courtCount = response.database.tables.courts.total
    const caseCount = response.database.tables.cases.total
    
    if (!response.database.connected) {
      response.status = 'error'
      response.recommendations.push('Database connection failed. Check Supabase credentials.')
    } else if (judgeCount === 0 && courtCount === 0) {
      response.status = 'empty'
      response.recommendations.push('Database is empty. Run: npm run populate:production')
    } else if (judgeCount < 100 || courtCount < 50) {
      response.status = 'partial'
      response.recommendations.push('Database has partial data. Consider running full sync.')
    } else {
      response.status = 'healthy'
    }
    
    // Add recommendations based on data
    if (judgeCount > 0 && caseCount === 0) {
      response.recommendations.push('No cases found. Consider generating sample cases.')
    }
    
    if (response.database.tables.judges.withDecisions < judgeCount * 0.5) {
      response.recommendations.push('Less than 50% of judges have decisions. Run decision sync.')
    }
    
    if (response.database.tables.analytics.cached < judgeCount * 0.5) {
      response.recommendations.push('Analytics cache is incomplete. Run: npm run analytics:generate')
    }
    
    if (!envValidation.valid) {
      response.recommendations.push('Environment variables are not properly configured.')
    }
    
    // Add data freshness warnings
    if (response.database.tables.judges.lastUpdated) {
      const lastUpdate = new Date(response.database.tables.judges.lastUpdated)
      const daysSinceUpdate = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceUpdate > 7) {
        response.recommendations.push(`Judge data is ${daysSinceUpdate} days old. Consider running sync.`)
      }
    }
    
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/admin/data-status', 200, duration, {
      status: response.status,
      judgeCount,
      courtCount,
      caseCount
    })
    
    return NextResponse.json(response)
    
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('API error in data status', { duration }, error instanceof Error ? error : undefined)
    logger.apiResponse('GET', '/api/admin/data-status', 500, duration)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}