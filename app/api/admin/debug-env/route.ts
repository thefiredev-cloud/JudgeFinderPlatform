import { NextRequest, NextResponse } from 'next/server'
import { DebugEnvManager } from '@/lib/admin/debug-env-manager'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (isProductionEnvironment()) {
    return NextResponse.json({ error: 'Debug endpoint is disabled in production' }, { status: 403 })
  }

  const manager = new DebugEnvManager()
  const status = await manager.gatherEnvironmentStatus()

  return NextResponse.json(status, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true'
}