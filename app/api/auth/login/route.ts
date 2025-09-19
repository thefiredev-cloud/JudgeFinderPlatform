import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_SITE_URL || 'https://judgefinder.io'))
}


