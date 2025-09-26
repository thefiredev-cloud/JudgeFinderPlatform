import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/utils/baseUrl'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.redirect(new URL('/sign-up', getBaseUrl()))
}

