import { notFound } from 'next/navigation'
import { Building, MapPin, Users, Scale, Phone, Globe, Gavel, Award, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import CourtJudgesSection from '@/components/courts/CourtJudgesSection'
import { CourtAdvertiserSlots } from '@/components/courts/CourtAdvertiserSlots'
import { SEOBreadcrumbs, generateCourtBreadcrumbs } from '@/components/seo/SEOBreadcrumbs'
import { 
  courtSlugToName, 
  generateCourtNameVariations, 
  generateCourtSlug, 
  isCourtIdentifier,
  normalizeCourtIdentifier,
  resolveCourtSlug 
} from '@/lib/utils/slug'
import type { Court } from '@/types'

export const dynamic = 'force-dynamic'

type Params = Promise<{ id: string }>

interface JudgeWithPosition {
  id: string
  name: string
  appointed_date: string | null
  position_type: string
  status: string
  courtlistener_id: string | null
}

// Fetch court using improved lookup strategy for both IDs and slugs
async function getCourt(id: string): Promise<Court | null> {
  try {
    const supabase = await createServerClient()
    
    // Decode the URL parameter in case it has URL encoding
    const decodedId = decodeURIComponent(id)
    console.log(`Looking up court: ${id} → ${decodedId}`)
    
    // Determine if this looks like a slug or an ID
    const { isSlug, isId } = isCourtIdentifier(decodedId)
    
    let court = null
    
    // Strategy 1: Try slug lookup first if it looks like a slug
    if (isSlug) {
      console.log('Attempting slug lookup...')
      const { data: courtBySlug } = await supabase
        .from('courts')
        .select('*')
        .eq('slug', decodedId)
        .maybeSingle()
      
      if (courtBySlug) {
        court = courtBySlug
        console.log('Found by slug')
      }
    }
    
    // Strategy 2: Try direct ID lookup if not found and looks like ID
    if (!court && isId) {
      console.log('Attempting ID lookup...')
      const { data: courtById } = await supabase
        .from('courts')
        .select('*')
        .eq('id', decodedId)
        .maybeSingle()
      
      if (courtById) {
        court = courtById
        console.log('Found by ID')
      }
    }
    
    // Strategy 3: Generate slug from the identifier and try lookup
    if (!court) {
      console.log('Attempting generated slug lookup...')
      const generatedSlug = generateCourtSlug(decodedId)
      
      if (generatedSlug && generatedSlug !== decodedId) {
        const { data: courtByGeneratedSlug } = await supabase
          .from('courts')
          .select('*')
          .eq('slug', generatedSlug)
          .maybeSingle()
        
        if (courtByGeneratedSlug) {
          court = courtByGeneratedSlug
          console.log('Found by generated slug')
        }
      }
    }
    
    // Strategy 4: Try name-based lookup (legacy support)
    if (!court) {
      console.log('Attempting name-based lookup...')
      const nameFromSlug = courtSlugToName(decodedId)
      const nameVariations = generateCourtNameVariations(nameFromSlug)
      
      for (const variation of nameVariations) {
        const { data: courtByName } = await supabase
          .from('courts')
          .select('*')
          .ilike('name', variation)
          .maybeSingle()
        
        if (courtByName) {
          court = courtByName
          console.log(`Found by name variation: ${variation}`)
          break
        }
      }
    }
    
    // Strategy 5: Partial name matching as last resort
    if (!court) {
      console.log('Attempting partial name matching...')
      const nameFromSlug = courtSlugToName(decodedId)
      
      const { data: courtByPartialName } = await supabase
        .from('courts')
        .select('*')
        .ilike('name', `%${nameFromSlug}%`)
        .limit(1)
        .maybeSingle()
      
      if (courtByPartialName) {
        court = courtByPartialName
        console.log('Found by partial name match')
      }
    }

    if (!court) {
      console.log(`Court not found for identifier: ${id} (decoded: ${decodedId})`)
      return null
    }

    // Ensure the court object is properly serialized (convert to plain object)
    // This prevents Next.js serialization errors when passing to client components
    return JSON.parse(JSON.stringify(court)) as Court
  } catch (error) {
    console.error('Error fetching court:', error)
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
    // Ensure judges data is properly serialized
    const serializedJudges = JSON.parse(JSON.stringify(data.judges || []))
    
    return {
      judges: serializedJudges,
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

  // Ensure court is properly serialized before using
  const serializedCourt = JSON.parse(JSON.stringify(court))
  const preferredCourtSlug = resolveCourtSlug(serializedCourt) || serializedCourt.id
  const { judges: initialJudges, totalCount } = await getInitialJudges(serializedCourt.id)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Enhanced Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            // Court Organization Schema
            {
              '@context': 'https://schema.org',
              '@type': 'GovernmentOffice',
              '@id': `https://judgefinder.io/courts/${preferredCourtSlug}#court`,
              name: serializedCourt.name,
              description: `${serializedCourt.name} is a ${serializedCourt.type} court serving ${serializedCourt.jurisdiction}. Research judges, view analytics, and find legal representation.`,
              url: `https://judgefinder.io/courts/${preferredCourtSlug}`,
              telephone: serializedCourt.phone,
              sameAs: serializedCourt.website ? [serializedCourt.website] : undefined,
              address: serializedCourt.address ? {
                '@type': 'PostalAddress',
                streetAddress: serializedCourt.address,
                addressRegion: serializedCourt.jurisdiction,
                addressCountry: 'US'
              } : undefined,
              areaServed: {
                '@type': 'State',
                name: serializedCourt.jurisdiction
              },
              serviceType: [
                'Legal Proceedings',
                'Judicial Services',
                'Court Administration'
              ],
              parentOrganization: {
                '@type': 'GovernmentOrganization',
                name: `${serializedCourt.jurisdiction} Judicial System`,
                url: `https://judgefinder.io/jurisdictions#${serializedCourt.jurisdiction.toLowerCase()}`
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
              '@id': `https://judgefinder.io/courts/${preferredCourtSlug}#localbusiness`,
              name: serializedCourt.name,
              description: `Official information and analytics for ${serializedCourt.name} in ${serializedCourt.jurisdiction}`,
              telephone: serializedCourt.phone,
              url: serializedCourt.website || `https://judgefinder.io/courts/${preferredCourtSlug}`,
              address: serializedCourt.address ? {
                '@type': 'PostalAddress',
                streetAddress: serializedCourt.address,
                addressRegion: serializedCourt.jurisdiction,
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
              '@id': `https://judgefinder.io/courts/${preferredCourtSlug}`,
              name: `${serializedCourt.name} - Court Information | JudgeFinder`,
              description: `Complete information about ${serializedCourt.name} including judges, contact details, and legal services. Find attorneys practicing in this ${serializedCourt.type} court.`,
              url: `https://judgefinder.io/courts/${preferredCourtSlug}`,
              isPartOf: {
                '@type': 'WebSite',
                '@id': 'https://judgefinder.io#website',
                name: 'JudgeFinder',
                url: 'https://judgefinder.io'
              },
              about: {
                '@id': `https://judgefinder.io/courts/${preferredCourtSlug}#court`
              },
              mainEntity: {
                '@id': `https://judgefinder.io/courts/${preferredCourtSlug}#court`
              }
            }
          ]),
        }}
      />

      <SEOBreadcrumbs
        items={generateCourtBreadcrumbs(
          serializedCourt.name,
          serializedCourt.jurisdiction || 'California',
          preferredCourtSlug
        )}
      />

      {/* Hero Section with Enhanced Gradient */}
      <div className="bg-gradient-to-br from-enterprise-primary/20 via-enterprise-deep/10 to-background px-4 py-12 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="mb-4 text-sm font-medium text-muted-foreground">
            Home / Courts / {serializedCourt.jurisdiction} / {serializedCourt.name}
          </div>
          <h1 className="mb-2 text-4xl md:text-5xl font-bold bg-gradient-to-r from-enterprise-primary to-enterprise-deep bg-clip-text text-transparent">{serializedCourt.name}</h1>
          <p className="text-xl text-muted-foreground capitalize">{serializedCourt.type} Court • {serializedCourt.jurisdiction}</p>
        </div>
      </div>

      {/* Attorney CTA Banner */}
      <div className="bg-gradient-to-r from-enterprise-primary to-enterprise-deep text-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Are you an attorney who practices in {serializedCourt.name}?</h2>
              <p className="mt-1 text-blue-100">Get premium visibility to potential clients researching judges in this court</p>
            </div>
            <Link 
              href="/signup" 
              className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
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
            <div className="rounded-xl bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-border">
              {/* Header with gradient background */}
              <div className="bg-gradient-to-r from-enterprise-primary to-enterprise-deep p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <Building className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{serializedCourt.name}</h2>
                      <p className="text-white/80 capitalize">{serializedCourt.type} Court</p>
                      <div className="flex items-center mt-1 text-sm text-white/70">
                        <MapPin className="h-4 w-4 mr-1" />
                        {serializedCourt.jurisdiction}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/70">Active Judges</p>
                    <p className="text-3xl font-bold">
                      {serializedCourt.judge_count || totalCount}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Court Information Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {serializedCourt.address && (
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/30 border border-border">
                      <MapPin className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Address</p>
                        <p className="text-sm text-muted-foreground">{serializedCourt.address}</p>
                      </div>
                    </div>
                  )}

                  {serializedCourt.phone && (
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/30 border border-border">
                      <Phone className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Phone</p>
                        <p className="text-sm text-muted-foreground">{serializedCourt.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/30 border border-border">
                    <Scale className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Court Type</p>
                      <p className="text-sm text-muted-foreground capitalize">{serializedCourt.type} Court</p>
                    </div>
                  </div>

                  {serializedCourt.website && (
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/30 border border-border">
                      <Globe className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Official Website</p>
                        <a href={serializedCourt.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary/80 transition-colors">
                          Visit Website →
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Court Statistics */}
                <div className="border-t border-border pt-6">
                  <h3 className="mb-4 text-lg font-semibold text-foreground flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                    Court Statistics
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 p-4 text-center border border-primary/20">
                      <Gavel className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-3xl font-bold text-foreground">
                        {serializedCourt.judge_count || totalCount}
                      </p>
                      <p className="text-sm text-muted-foreground">Active Judges</p>
                    </div>
                    <div className="rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/20 p-4 text-center border border-green-500/20">
                      <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-foreground">
                        2,500+
                      </p>
                      <p className="text-sm text-muted-foreground">Monthly Searches</p>
                    </div>
                    <div className="rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/20 p-4 text-center border border-purple-500/20">
                      <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-foreground">
                        Est. 1850
                      </p>
                      <p className="text-sm text-muted-foreground">Established</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Judges Section */}
            <CourtJudgesSection 
              courtId={serializedCourt.id} 
              courtName={serializedCourt.name}
              initialJudges={initialJudges}
            />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Advertiser Slots */}
            <CourtAdvertiserSlots 
              courtId={serializedCourt.id} 
              courtName={serializedCourt.name} 
            />
            
            {/* Quick Actions */}
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link 
                  href={`/judges?court=${encodeURIComponent(serializedCourt.name)}`}
                  className="block w-full text-center bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 font-medium transition-all duration-200 hover:scale-105"
                >
                  Browse All {totalCount > 0 ? `${totalCount} ` : ''}Judges
                </Link>
                <Link 
                  href="/signup"
                  className="block w-full text-center border border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary/10 font-medium transition-all duration-200"
                >
                  Advertise Your Practice
                </Link>
              </div>
            </div>

            {/* Court Resources */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
              <h3 className="text-lg font-semibold text-foreground mb-2">Need Legal Representation?</h3>
              <p className="text-muted-foreground mb-4">
                Find experienced attorneys who practice in this court and understand its procedures.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Experienced in {serializedCourt.jurisdiction} law</p>
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
  
  const metadataCourtSlug = resolveCourtSlug(court) || court.id
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://judgefinder.io').replace(/\/$/, '')
  const canonicalUrl = `${baseUrl}/courts/${metadataCourtSlug}`

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
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${court.name} - Court Directory`,
      description: `Official information for ${court.name} including judges, contact details, and attorney directory.`,
      type: 'website',
      url: canonicalUrl,
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
