import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

/**
 * API template for Next.js App Router endpoint
 * Endpoint: %%ENDPOINT_PATH%%
 */
export async function GET(req: NextRequest) {
  const start = Date.now()
  try {
    const supabase = await createServerClient()

    // Example query: list a few judges
    const { data, error } = await supabase
      .from('judges')
      .select('id, name, court_name')
      .limit(10)

    if (error) {
      logger.error('DB error in template endpoint', { error: error.message })
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const res = NextResponse.json({ success: true, data })
    res.headers.set('Cache-Control', 'no-store')
    logger.apiResponse('GET', '%%ENDPOINT_PATH%%', 200, Date.now() - start, { count: data?.length || 0 })
    return res
  } catch (err) {
    logger.error(
      'Unhandled error in template endpoint',
      undefined,
      err instanceof Error ? err : undefined
    )
    logger.apiResponse('GET', '%%ENDPOINT_PATH%%', 500, Date.now() - start)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

