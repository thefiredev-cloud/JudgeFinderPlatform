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
  title: 'California Courts Directory | JudgeFinder',
  description: 'Browse all 852 California courts. Search by court type, jurisdiction, and name. Find contact information and assigned judges for comprehensive legal research.',
  keywords: 'California courts, court directory, superior courts, municipal courts, legal research, court information',
}

async function getInitialCourts(): Promise<Court[]> {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('courts')
      .select('id, name, type, jurisdiction, slug, address, phone, website, judge_count')
      .eq('jurisdiction', 'CA') // Default to California
      .order('name')
      .limit(20)

    if (error) {
      return []
    }

    return data as Court[]
  } catch (error) {
    return []
  }
}

export default async function CourtsPage() {
  const initialCourts = await getInitialCourts()

  return <CourtsPageClient initialCourts={initialCourts} />
}