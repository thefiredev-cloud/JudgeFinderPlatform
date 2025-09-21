import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/utils/baseUrl'

export async function GET() {
  return NextResponse.redirect(new URL('/sign-up', getBaseUrl()))
}

