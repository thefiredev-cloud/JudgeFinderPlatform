import { notFound } from 'next/navigation'
import { Building, MapPin, Users, Scale, Phone, Globe, Gavel, Award, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import CourtJudgesSection from '@/components/courts/CourtJudgesSection'
import type { Court } from '@/types'

type Params = Promise<{ id: string }>

interface JudgeWithPosition {
  id: string
  name: string
  appointed_date: string | null
  position_type: string
  status: string
  courtlistener_id: string | null
}

// Fetch court using direct database lookup
async function getCourt(id: string): Promise<Court | null> {
  try {
    const supabase = await createServerClient()
    
    const { data: court, error } = await supabase
      .from('courts')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !court) {
      console.log(`Court not found for ID: ${id}`)
      return null
    }

    return court as Court
  } catch (error) {
    console.error('Error fetching court by ID:', error)
    return null
  }
}


// Get initial judges data for the court (first few for initial render)
async function getInitialJudges(courtId: string): Promise<{ judges: JudgeWithPosition[], totalCount: number }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/api/courts/${courtId}/judges?limit=5&page=1`, {
      cache: 'force-cache',
      next: { revalidate: 1800 } // 30 minutes
    })
    
    if (!response.ok) {
      return { judges: [], totalCount: 0 }
    }
    
    const data = await response.json()
    return {
      judges: data.judges || [],
      totalCount: data.total_count || 0
    }
  } catch (error) {
    console.error('Error fetching initial court judges:', error)
    return { judges: [], totalCount: 0 }
  }
}

export default async function CourtPage({ params }: { params: Params }) {
  const { id } = await params
  const court = await getCourt(id)

  if (!court) {
    notFound()
  }

  const { judges: initialJudges, totalCount } = await getInitialJudges(court.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            // Court Organization Schema
            {
              '@context': 'https://schema.org',
              '@type': 'GovernmentOffice',
              '@id': `https://judgefinder.io/courts/${id}#court`,
              name: court.name,
              description: `${court.name} is a ${court.type} court serving ${court.jurisdiction}. Research judges, view analytics, and find legal representation.`,
              url: `https://judgefinder.io/courts/${id}`,
              telephone: court.phone,
              sameAs: court.website ? [court.website] : undefined,
              address: court.address ? {
                '@type': 'PostalAddress',
                streetAddress: court.address,
                addressRegion: court.jurisdiction,
                addressCountry: 'US'
              } : undefined,
              areaServed: {
                '@type': 'State',
                name: court.jurisdiction
              },
              serviceType: [
                'Legal Proceedings',
                'Judicial Services',
                'Court Administration'
              ],
              parentOrganization: {
                '@type': 'GovernmentOrganization',
                name: `${court.jurisdiction} Judicial System`,
                url: `https://judgefinder.io/jurisdictions#${court.jurisdiction.toLowerCase()}`
              },
              employee: initialJudges.slice(0, 5).map((judge: JudgeWithPosition) => ({
                '@type': 'Person',
                '@id': `https://judgefinder.io/judges/${judge.name.toLowerCase().replace(/\s+/g, '-').replace(/[.,]/g, '')}#judge`,
                name: judge.name,
                jobTitle: judge.position_type || 'Judge',
                url: `https://judgefinder.io/judges/${judge.name.toLowerCase().replace(/\s+/g, '-').replace(/[.,]/g, '')}`
              }))
            },
            // Local Business Schema for better local SEO
            {
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              '@id': `https://judgefinder.io/courts/${id}#localbusiness`,
              name: court.name,
              description: `Official information and analytics for ${court.name} in ${court.jurisdiction}`,
              telephone: court.phone,
              url: court.website || `https://judgefinder.io/courts/${id}`,
              address: court.address ? {
                '@type': 'PostalAddress',
                streetAddress: court.address,
                addressRegion: court.jurisdiction,
                addressCountry: 'US'
              } : undefined,
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: '08:00',
                closes: '17:00'
              }
            },
            // WebPage Schema
            {
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              '@id': `https://judgefinder.io/courts/${id}`,
              name: `${court.name} - Court Information | JudgeFinder`,
              description: `Complete information about ${court.name} including judges, contact details, and legal services. Find attorneys practicing in this ${court.type} court.`,
              url: `https://judgefinder.io/courts/${id}`,
              isPartOf: {
                '@type': 'WebSite',
                '@id': 'https://judgefinder.io#website',
                name: 'JudgeFinder',
                url: 'https://judgefinder.io'
              },
              about: {
                '@id': `https://judgefinder.io/courts/${id}#court`
              },
              mainEntity: {
                '@id': `https://judgefinder.io/courts/${id}#court`
              }
            }
          ]),
        }}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 px-4 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 text-sm font-medium text-gray-300">
            Home / Courts / {court.jurisdiction} / {court.name}
          </div>
          <h1 className="mb-2 text-4xl font-bold">{court.name}</h1>
          <p className="text-xl text-gray-300 capitalize">{court.type} Court • {court.jurisdiction}</p>
        </div>
      </div>

      {/* Attorney CTA Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Are you an attorney who practices in {court.name}?</h2>
              <p className="mt-1 text-blue-100">Get premium visibility to potential clients researching judges in this court</p>
            </div>
            <Link 
              href="/signup" 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Advertise Your Practice →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Court Profile */}
          <div className="lg:col-span-2 space-y-8">
            {/* Court Profile Card */}
            <div className="rounded-lg bg-white shadow-md overflow-hidden">
              {/* Header with gradient background */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <Building className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{court.name}</h2>
                      <p className="text-blue-100 capitalize">{court.type} Court</p>
                      <div className="flex items-center mt-1 text-sm text-blue-200">
                        <MapPin className="h-4 w-4 mr-1" />
                        {court.jurisdiction}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-200">Active Judges</p>
                    <p className="text-3xl font-bold">
                      {court.judge_count || totalCount}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Court Information Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {court.address && (
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50">
                      <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Address</p>
                        <p className="text-sm text-gray-600">{court.address}</p>
                      </div>
                    </div>
                  )}

                  {court.phone && (
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50">
                      <Phone className="h-5 w-5 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <p className="text-sm text-gray-600">{court.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50">
                    <Scale className="h-5 w-5 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Court Type</p>
                      <p className="text-sm text-gray-600 capitalize">{court.type} Court</p>
                    </div>
                  </div>

                  {court.website && (
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50">
                      <Globe className="h-5 w-5 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Official Website</p>
                        <a href={court.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700">
                          Visit Website →
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Court Statistics */}
                <div className="border-t pt-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Court Statistics
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-center">
                      <Gavel className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-gray-900">
                        {court.judge_count || totalCount}
                      </p>
                      <p className="text-sm text-gray-600">Active Judges</p>
                    </div>
                    <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4 text-center">
                      <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-gray-900">
                        2,500+
                      </p>
                      <p className="text-sm text-gray-600">Monthly Searches</p>
                    </div>
                    <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4 text-center">
                      <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-gray-900">
                        Est. 1850
                      </p>
                      <p className="text-sm text-gray-600">Established</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Judges Section */}
            <CourtJudgesSection 
              courtId={court.id} 
              courtName={court.name}
              initialJudges={initialJudges}
            />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link 
                  href={`/judges?court=${encodeURIComponent(court.name)}`}
                  className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium transition-colors"
                >
                  Browse All {totalCount > 0 ? `${totalCount} ` : ''}Judges
                </Link>
                <Link 
                  href="/signup"
                  className="block w-full text-center border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50 font-medium transition-colors"
                >
                  Advertise Your Practice
                </Link>
              </div>
            </div>

            {/* Court Resources */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Legal Representation?</h3>
              <p className="text-gray-600 mb-4">
                Find experienced attorneys who practice in this court and understand its procedures.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Experienced in {court.jurisdiction} law</p>
                <p>• Familiar with court procedures</p>
                <p>• High success rates</p>
                <p>• Client testimonials available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params
  const court = await getCourt(id)
  
  if (!court) {
    return {
      title: 'Court Not Found | JudgeFinder',
      description: 'The requested court could not be found. Search our database of 167+ California courts.',
    }
  }

  // Extract city/location from court name for local SEO
  const cityMatch = court.name.match(/(.+?)\s+(Superior|Municipal|District|Court)/i)
  const cityName = cityMatch ? cityMatch[1].trim() : court.jurisdiction
  
  // Create location-focused description
  const description = `Complete information about ${court.name} in ${court.jurisdiction}. Find judges, contact information, court procedures, and experienced attorneys practicing in this ${court.type} court. Essential resource for legal professionals.`
  
  return {
    title: `${court.name} - ${cityName} ${court.type.charAt(0).toUpperCase() + court.type.slice(1)} Court | JudgeFinder`,
    description: description,
    keywords: [
      court.name,
      `${cityName} ${court.type} court`,
      `${court.jurisdiction} court`,
      `${cityName} courthouse`,
      `${court.name} judges`,
      `${court.name} attorneys`,
      `${cityName} legal services`,
      'court information',
      'legal representation',
      'judicial directory'
    ].join(', '),
    alternates: {
      canonical: `/courts/${id}`,
    },
    openGraph: {
      title: `${court.name} - Court Directory`,
      description: `Official information for ${court.name} including judges, contact details, and attorney directory.`,
      type: 'website',
      url: `https://judgefinder.io/courts/${id}`,
      siteName: 'JudgeFinder',
      images: [
        {
          url: '/og-court-profile.png',
          width: 1200,
          height: 630,
          alt: `${court.name} Information - JudgeFinder`
        }
      ],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${court.name} - Court Directory`,
      description: `Find judges and attorneys at ${court.name} on JudgeFinder`,
      images: ['/twitter-court-profile.png'],
    },
    authors: [{ name: 'JudgeFinder Legal Directory' }],
    category: 'Court Directory',
    classification: 'Legal Directory Platform',
  }
}
