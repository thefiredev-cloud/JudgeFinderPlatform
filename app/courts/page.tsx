import { CourtsSearch } from '@/components/courts/CourtsSearch'
import { createServerClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

interface Court {
  id: string
  name: string
  type: string
  jurisdiction: string
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
      .select('id, name, type, jurisdiction, address, phone, website, judge_count')
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 px-4 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 text-sm font-medium text-gray-300">
            Home / Courts
          </div>
          <h1 className="mb-2 text-4xl font-bold">California Courts Directory</h1>
          <p className="text-xl text-gray-300">
            Browse 852+ courts across California. Search by type, jurisdiction, and location.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <CourtsSearch initialCourts={initialCourts} initialJurisdiction="CA" />
      </div>
    </div>
  )
}