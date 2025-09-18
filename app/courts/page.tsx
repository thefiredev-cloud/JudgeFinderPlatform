import { createServerClient } from '@/lib/supabase/server'
import { CourtsPageClient } from '@/components/courts/CourtsPageClient'
import type { Metadata } from 'next'

// Force dynamic rendering since we need to query the database with cookies
export const dynamic = 'force-dynamic'

interface Court {
  id: string
  name: string
  type: string
  jurisdiction: string
  slug?: string
  address?: string | number
  phone?: string
  website?: string
  judge_count: number
}

export const metadata: Metadata = {
  title: 'Courts Directory | JudgeFinder',
  description: 'Browse courts and judges. Search by type, jurisdiction, and name. Find contact information and assigned judges for comprehensive legal research.',
  keywords: 'courts directory, federal courts, state courts, legal research, court information, California courts',
}

async function getInitialCourts(jurisdiction?: string): Promise<Court[]> {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('courts')
      .select('id, name, type, jurisdiction, slug, address, phone, website, judge_count')
      // If a jurisdiction is provided (e.g. 'CA', 'US'), filter; otherwise show all
      .match(jurisdiction && jurisdiction !== 'ALL' ? { jurisdiction } : {})
      .order('name')
      .limit(20)

    if (error) {
      console.error('Error fetching courts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getInitialCourts:', error)
    return []
  }
}

export default async function CourtsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const jurisdictionParam = (resolvedSearchParams?.jurisdiction as string | undefined) || 'CA'
  const initialCourts = await getInitialCourts(jurisdictionParam)

  return <CourtsPageClient initialCourts={initialCourts} initialJurisdiction={jurisdictionParam} />
}
