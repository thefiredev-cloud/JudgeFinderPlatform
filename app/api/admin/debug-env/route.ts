import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface DebugInfo {
  timestamp: string
  runtime: string
  node_env: string | undefined
  environment_variables: {
    found: string[]
    missing: string[]
    values: Record<string, string>
  }
  supabase_connection: {
    url_present: boolean
    anon_key_present: boolean
    service_key_present: boolean
    url_format_valid: boolean
    connection_test: {
      success: boolean
      error?: string
      tables_found?: string[]
    }
  }
  database_counts: {
    judges: number | null
    courts: number | null
    cases: number | null
    error?: string
  }
}

export async function GET(request: NextRequest) {
  // Disable debug endpoint in production for security
  if (process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true') {
    return NextResponse.json(
      { error: 'Debug endpoint is disabled in production' },
      { status: 403 }
    )
  }
  
  console.log('Debug endpoint called')
  
  // List of expected environment variables
  const expectedVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'COURTLISTENER_API_KEY',
    'NEXT_PUBLIC_SITE_URL',
    'NODE_ENV',
    'VERCEL_ENV',
    'NETLIFY',
    'CONTEXT'
  ]
  
  const debugInfo: DebugInfo = {
    timestamp: new Date().toISOString(),
    runtime: typeof process !== 'undefined' ? 'Node.js' : 'Edge',
    node_env: process.env.NODE_ENV,
    environment_variables: {
      found: [],
      missing: [],
      values: {}
    },
    supabase_connection: {
      url_present: false,
      anon_key_present: false,
      service_key_present: false,
      url_format_valid: false,
      connection_test: {
        success: false
      }
    },
    database_counts: {
      judges: null,
      courts: null,
      cases: null
    }
  }
  
  // Check which environment variables are present
  for (const varName of expectedVars) {
    const value = process.env[varName]
    if (value) {
      debugInfo.environment_variables.found.push(varName)
      // Completely redact sensitive values for security
      if (varName.includes('KEY') || varName.includes('SECRET') || varName.includes('TOKEN')) {
        debugInfo.environment_variables.values[varName] = '***REDACTED***'
      } else if (varName.includes('URL')) {
        // For URLs, show the domain but not the full value
        try {
          const url = new URL(value)
          debugInfo.environment_variables.values[varName] = `${url.protocol}//${url.hostname}/***`
        } catch {
          debugInfo.environment_variables.values[varName] = '***INVALID_URL***'
        }
      } else {
        debugInfo.environment_variables.values[varName] = value
      }
    } else {
      debugInfo.environment_variables.missing.push(varName)
    }
  }
  
  // Check Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  debugInfo.supabase_connection.url_present = !!supabaseUrl
  debugInfo.supabase_connection.anon_key_present = !!supabaseAnonKey
  debugInfo.supabase_connection.service_key_present = !!supabaseServiceKey
  
  if (supabaseUrl) {
    debugInfo.supabase_connection.url_format_valid = 
      supabaseUrl.startsWith('https://') && 
      supabaseUrl.includes('.supabase.co')
  }
  
  // Try to connect to Supabase if credentials are present
  if (supabaseUrl && supabaseServiceKey) {
    try {
      // Remove console logs that might expose sensitive information
      // console.log('Attempting Supabase connection...')
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })
      
      // Try to list tables
      const { data: tables, error: tablesError } = await supabase
        .from('judges')
        .select('id')
        .limit(1)
      
      if (tablesError) {
        // console.error('Supabase connection error:', tablesError)
        debugInfo.supabase_connection.connection_test.success = false
        debugInfo.supabase_connection.connection_test.error = tablesError.message
      } else {
        // console.log('Supabase connection successful')
        debugInfo.supabase_connection.connection_test.success = true
        
        // Get counts if connection successful
        try {
          const { count: judgeCount } = await supabase
            .from('judges')
            .select('*', { count: 'exact', head: true })
          
          const { count: courtCount } = await supabase
            .from('courts')
            .select('*', { count: 'exact', head: true })
          
          const { count: caseCount } = await supabase
            .from('cases')
            .select('*', { count: 'exact', head: true })
          
          debugInfo.database_counts.judges = judgeCount || 0
          debugInfo.database_counts.courts = courtCount || 0
          debugInfo.database_counts.cases = caseCount || 0
          
          // console.log('Database counts:', debugInfo.database_counts)
        } catch (countError: any) {
          // console.error('Error getting counts:', countError)
          debugInfo.database_counts.error = countError.message
        }
      }
    } catch (error: any) {
      // console.error('Supabase connection failed:', error)
      debugInfo.supabase_connection.connection_test.success = false
      debugInfo.supabase_connection.connection_test.error = error.message || 'Unknown error'
    }
  } else {
    debugInfo.supabase_connection.connection_test.error = 'Missing required credentials'
  }
  
  // Determine if this is running on Netlify
  const isNetlify = process.env.NETLIFY === 'true' || !!process.env.CONTEXT
  const netlifyContext = process.env.CONTEXT || 'unknown'
  
  // Add Netlify-specific information
  if (isNetlify) {
    debugInfo.runtime = `Netlify (${netlifyContext})`
  }
  
  return NextResponse.json(debugInfo, {
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  })
}