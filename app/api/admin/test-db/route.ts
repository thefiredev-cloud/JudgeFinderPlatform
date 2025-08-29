import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: []
  }
  
  // Test 1: Check if environment variables exist
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  results.tests.push({
    name: 'Environment Variables Present',
    url_exists: !!url,
    anon_key_exists: !!anonKey,
    service_key_exists: !!serviceKey,
    url_value: url ? url.substring(0, 30) + '...' : 'NOT SET',
    passed: !!(url && (anonKey || serviceKey))
  })
  
  // Test 2: Try connection with anon key
  if (url && anonKey) {
    try {
      const supabase = createClient(url, anonKey, {
        auth: { persistSession: false }
      })
      
      const { data, error } = await supabase
        .from('judges')
        .select('id')
        .limit(1)
      
      results.tests.push({
        name: 'Anon Key Connection',
        success: !error,
        error: error?.message,
        data_found: !!data,
        passed: !error
      })
    } catch (e: any) {
      results.tests.push({
        name: 'Anon Key Connection',
        success: false,
        error: e.message,
        passed: false
      })
    }
  }
  
  // Test 3: Try connection with service key
  if (url && serviceKey) {
    try {
      const supabase = createClient(url, serviceKey, {
        auth: { persistSession: false }
      })
      
      // Get counts
      const { count: judgeCount, error: judgeError } = await supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })
      
      const { count: courtCount, error: courtError } = await supabase
        .from('courts')
        .select('*', { count: 'exact', head: true })
      
      const { count: caseCount, error: caseError } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
      
      results.tests.push({
        name: 'Service Key Connection',
        success: !judgeError && !courtError,
        judges: judgeCount || 0,
        courts: courtCount || 0,
        cases: caseCount || 0,
        errors: {
          judges: judgeError?.message,
          courts: courtError?.message,
          cases: caseError?.message
        },
        passed: !judgeError && !courtError && (judgeCount || 0) > 0
      })
      
      results.database_populated = (judgeCount || 0) > 0
      
    } catch (e: any) {
      results.tests.push({
        name: 'Service Key Connection',
        success: false,
        error: e.message,
        passed: false
      })
    }
  }
  
  // Test 4: Check Netlify context
  results.tests.push({
    name: 'Runtime Environment',
    is_netlify: process.env.NETLIFY === 'true',
    netlify_context: process.env.CONTEXT,
    node_env: process.env.NODE_ENV,
    is_production: process.env.NODE_ENV === 'production',
    passed: true
  })
  
  // Overall status
  results.all_passed = results.tests.every((t: any) => t.passed)
  results.connection_working = results.tests.some((t: any) => 
    t.name.includes('Connection') && t.passed
  )
  
  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  })
}