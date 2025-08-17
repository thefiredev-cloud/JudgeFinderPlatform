import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MapPin, Building, Users, Scale, TrendingUp } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'California Court Jurisdictions | County Courts & Judicial Districts | JudgeFinder',
  description: 'Browse California courts by jurisdiction and county. Find judges, court information, and legal services in Los Angeles, San Francisco, Orange County, San Diego, and all 58 California counties.',
  keywords: 'California courts, county courts, judicial districts, Los Angeles courts, San Francisco courts, Orange County courts, San Diego courts, California counties, local courts',
  openGraph: {
    title: 'California Court Jurisdictions - County Courts & Judicial Districts',
    description: 'Find courts and judges in your California jurisdiction. Complete directory of county courts.',
    type: 'website',
    url: 'https://judgefinder.io/jurisdictions',
  }
}

interface Jurisdiction {
  name: string
  type: 'county' | 'district' | 'region'
  judgeCount: number
  courtCount: number
  population: number
  majorCities: string[]
  description: string
  slug: string
}

const majorJurisdictions: Jurisdiction[] = [
  {
    name: 'Los Angeles County',
    type: 'county',
    judgeCount: 347,
    courtCount: 38,
    population: 10000000,
    majorCities: ['Los Angeles', 'Long Beach', 'Pasadena', 'Burbank', 'Glendale'],
    description: 'Largest judicial system in California with comprehensive trial and appellate courts.',
    slug: 'los-angeles-county'
  },
  {
    name: 'Orange County',
    type: 'county',
    judgeCount: 89,
    courtCount: 12,
    population: 3175000,
    majorCities: ['Anaheim', 'Santa Ana', 'Irvine', 'Huntington Beach', 'Garden Grove'],
    description: 'Major Southern California jurisdiction serving diverse communities and businesses.',
    slug: 'orange-county'
  },
  {
    name: 'San Diego County',
    type: 'county',
    judgeCount: 112,
    courtCount: 15,
    population: 3338000,
    majorCities: ['San Diego', 'Chula Vista', 'Oceanside', 'Escondido', 'Carlsbad'],
    description: 'Southern California coastal jurisdiction with federal and state court systems.',
    slug: 'san-diego-county'
  },
  {
    name: 'San Francisco County',
    type: 'county',
    judgeCount: 67,
    courtCount: 8,
    population: 875000,
    majorCities: ['San Francisco'],
    description: 'Metropolitan jurisdiction with specialized business and technology courts.',
    slug: 'san-francisco-county'
  },
  {
    name: 'Santa Clara County',
    type: 'county',
    judgeCount: 78,
    courtCount: 11,
    population: 1936000,
    majorCities: ['San Jose', 'Sunnyvale', 'Santa Clara', 'Mountain View', 'Palo Alto'],
    description: 'Silicon Valley jurisdiction handling technology and intellectual property cases.',
    slug: 'santa-clara-county'
  },
  {
    name: 'Alameda County',
    type: 'county',
    judgeCount: 92,
    courtCount: 13,
    population: 1670000,
    majorCities: ['Oakland', 'Fremont', 'Berkeley', 'Hayward', 'San Leandro'],
    description: 'Bay Area jurisdiction with diverse civil and criminal caseloads.',
    slug: 'alameda-county'
  }
]

async function getJurisdictionData() {
  const supabase = await createServerClient()
  
  // Get actual jurisdiction data from database
  const { data: jurisdictionStats } = await supabase
    .from('judges')
    .select('jurisdiction')
    .then(result => {
      const stats = {}
      result.data?.forEach(judge => {
        const jurisdiction = judge.jurisdiction
        if (jurisdiction) {
          stats[jurisdiction] = (stats[jurisdiction] || 0) + 1
        }
      })
      return { data: stats }
    })

  const { data: courts } = await supabase
    .from('courts')
    .select('id, name, jurisdiction, type, address')
    .limit(50)

  return {
    jurisdictionStats: jurisdictionStats || {},
    courts: courts || []
  }
}

// Function to convert jurisdiction name to URL slug
function createSlugFromJurisdiction(jurisdiction: string): string {
  return jurisdiction
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
}

export default async function JurisdictionsPage() {
  const { jurisdictionStats, courts } = await getJurisdictionData()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'California Court Jurisdictions - County Courts Directory',
            description: 'Complete directory of California court jurisdictions, county courts, and judicial districts',
            url: 'https://judgefinder.io/jurisdictions',
            mainEntity: {
              '@type': 'ItemList',
              name: 'California Court Jurisdictions',
              itemListElement: majorJurisdictions.map((jurisdiction, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'AdministrativeArea',
                  name: jurisdiction.name,
                  description: jurisdiction.description,
                  containedInPlace: {
                    '@type': 'State',
                    name: 'California'
                  }
                }
              }))
            },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://judgefinder.io'
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Jurisdictions',
                  item: 'https://judgefinder.io/jurisdictions'
                }
              ]
            }
          }),
        }}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 px-4 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl">
              California Court Jurisdictions
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-300">
              Find courts and judges in your California jurisdiction. Complete directory of county courts,
              judicial districts, and local legal services across all 58 counties.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="rounded-lg bg-blue-600 px-3 py-1">58 Counties</span>
              <span className="rounded-lg bg-green-600 px-3 py-1">167+ Courts</span>
              <span className="rounded-lg bg-purple-600 px-3 py-1">1,130+ Judges</span>
            </div>
          </div>
        </div>
      </div>

      {/* Major Jurisdictions */}
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Major California Jurisdictions</h2>
          <p className="text-lg text-gray-600">
            Browse the largest court jurisdictions in California. Find judges, court locations,
            and legal services in major metropolitan areas.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {majorJurisdictions.map((jurisdiction) => (
            <div
              key={jurisdiction.name}
              className="group rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg hover:scale-105"
            >
              <div className="mb-4 flex items-center">
                <div className="mr-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{jurisdiction.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{jurisdiction.type}</p>
                </div>
              </div>
              
              <p className="mb-4 text-gray-600 text-sm">{jurisdiction.description}</p>
              
              <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold text-gray-900">{jurisdiction.judgeCount}</div>
                  <div className="text-gray-500">Judges</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold text-gray-900">{jurisdiction.courtCount}</div>
                  <div className="text-gray-500">Courts</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Major Cities:</div>
                <div className="flex flex-wrap gap-1">
                  {jurisdiction.majorCities.slice(0, 3).map((city) => (
                    <span
                      key={city}
                      className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </div>

              <Link
                href={`/jurisdictions/${jurisdiction.slug}`}
                className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-white font-medium hover:bg-blue-700 transition-colors"
              >
                View Courts & Judges →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* All California Counties */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">All California Counties</h2>
            <p className="text-lg text-gray-600">
              Complete directory of all 58 California counties and their court systems
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Object.entries(jurisdictionStats).map(([jurisdiction, count]) => (
              <Link
                key={jurisdiction}
                href={`/jurisdictions/${createSlugFromJurisdiction(jurisdiction)}`}
                className="group rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      {jurisdiction}
                    </h3>
                    <p className="text-sm text-gray-500">{count} judges</p>
                  </div>
                  <MapPin className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Court Directory */}
      <div className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Recent Court Additions</h2>
            <p className="text-lg text-gray-600">
              Newly added courts to our directory
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courts.slice(0, 6).map((court) => (
              <Link
                key={court.id}
                href={`/courts/${court.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="group rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md hover:scale-105"
              >
                <div className="mb-4 flex items-start">
                  <Building className="mr-3 h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      {court.name}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">{court.type} Court</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    {court.jurisdiction}
                  </div>
                  {court.address && (
                    <div className="text-xs text-gray-500 truncate">
                      {court.address}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-sm text-blue-600 font-medium">
                  View Court Details →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Legal Services CTA */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Need Legal Help in Your Area?</h2>
          <p className="mb-8 text-xl text-green-100">
            Find experienced local attorneys who practice in your jurisdiction and understand local court procedures.
          </p>
          <div className="space-y-4 md:flex md:justify-center md:space-x-4 md:space-y-0">
            <Link
              href="/attorneys"
              className="block rounded-lg bg-white px-8 py-3 font-semibold text-green-600 hover:bg-gray-100 transition-colors"
            >
              Find Local Attorneys
            </Link>
            <Link
              href="/courts"
              className="block rounded-lg border border-white px-8 py-3 font-semibold text-white hover:bg-white hover:text-green-600 transition-colors"
            >
              Browse All Courts
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}