import { notFound } from 'next/navigation'
import { JudgeProfile } from '@/components/judges/JudgeProfile'
import { JudgeRulingPatterns } from '@/components/judges/JudgeRulingPatterns'
import { RecentDecisions } from '@/components/judges/RecentDecisions'
import { AttorneySlots } from '@/components/judges/AttorneySlots'
import { JudgeFAQ } from '@/components/judges/JudgeFAQ'
import AnalyticsSliders from '@/components/judges/AnalyticsSliders'
import { isValidSlug } from '@/lib/utils/slug'
import type { Judge, JudgeLookupResult } from '@/types'

/**
 * Fetch judge using the enhanced API endpoint
 * Provides better error handling and detailed lookup information
 */
async function getJudge(slug: string): Promise<Judge | null> {
  try {
    // Validate slug format first
    if (!isValidSlug(slug)) {
      console.log(`Invalid slug format: ${slug}`)
      return null
    }

    // Use the new API endpoint for consistent lookup logic
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://judgefinder.io'
      : 'http://localhost:3005'
      
    const response = await fetch(`${baseUrl}/api/judges/by-slug?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour (judge data is stable)
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Try to get suggestions from the API response
        try {
          const errorData = await response.json()
          if (errorData.suggestions && errorData.suggestions.length > 0) {
            console.log(`Judge not found for slug: ${slug}, but found ${errorData.suggestions.length} suggestions`)
            // Could potentially redirect to the first suggestion, but for now return null
          }
        } catch (parseError) {
          console.log('Could not parse error response for suggestions')
        }
        return null
      }
      throw new Error(`API request failed: ${response.status}`)
    }

    const data: JudgeLookupResult = await response.json()
    
    if (data.judge) {
      console.log(`Found judge via API: ${data.judge.name} (method: ${data.found_by})`)
      return data.judge
    }

    return null
  } catch (error) {
    console.error('Error fetching judge from API:', error)
    
    // Fallback to direct database access if API fails
    console.log('Attempting fallback to direct database access...')
    return await getJudgeFallback(slug)
  }
}

/**
 * Fallback function for direct database access when API fails
 * Simplified version of the original logic
 */
async function getJudgeFallback(slug: string): Promise<Judge | null> {
  try {
    const { createServerClient } = await import('@/lib/supabase/server')
    const { slugToName, generateNameVariations } = await import('@/lib/utils/slug')
    
    const supabase = await createServerClient()
    
    // Try direct slug lookup first
    const { data: slugJudge, error: slugError } = await supabase
      .from('judges')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (!slugError && slugJudge) {
      return slugJudge as Judge
    }

    // Convert slug to name and try variations
    const primaryName = slugToName(slug)
    const nameVariations = generateNameVariations(primaryName)
    
    // Try exact name matches
    for (const nameVariation of nameVariations.slice(0, 5)) { // Limit for performance
      const { data: judges, error } = await supabase
        .from('judges')
        .select('*')
        .ilike('name', nameVariation)
        .limit(3)

      if (!error && judges && judges.length > 0) {
        return judges[0] as Judge
      }
    }

    return null
  } catch (error) {
    console.error('Error in fallback judge lookup:', error)
    return null
  }
}

interface JudgePageProps {
  params: { slug: string }
}

export default async function JudgePage({ params }: JudgePageProps) {
  // Add param validation
  if (!params.slug || typeof params.slug !== 'string') {
    console.error('Invalid slug parameter:', params.slug)
    notFound()
  }

  const judge = await getJudge(params.slug)

  if (!judge) {
    console.log(`Judge not found for slug: ${params.slug}`)
    notFound()
  }

  // Additional validation to ensure we have required fields
  if (!judge.id || !judge.name) {
    console.error('Judge data is incomplete:', judge)
    notFound()
  }

  // Safe variables for display
  const safeName = judge.name || 'Unknown Judge'
  const safeCourtName = judge.court_name || 'Unknown Court'
  const safeJurisdiction = judge.jurisdiction || 'Unknown Jurisdiction'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            // Judge Person Schema
            {
              '@context': 'https://schema.org',
              '@type': 'Person',
              '@id': `https://judgefinder.io/judges/${params.slug}#judge`,
              name: safeName,
              jobTitle: 'Judge',
              description: judge.bio || `Judicial profile and analytics for ${safeName} serving at ${safeCourtName}`,
              worksFor: {
                '@type': 'Organization',
                '@id': `https://judgefinder.io/courts/${safeCourtName.toLowerCase().replace(/\s+/g, '-')}#organization`,
                name: safeCourtName,
                address: {
                  '@type': 'PostalAddress',
                  addressRegion: safeJurisdiction
                }
              },
              alumniOf: judge.education ? judge.education.split(';').map(edu => ({
                '@type': 'EducationalOrganization',
                name: edu.trim()
              })) : undefined,
              knowsAbout: [
                'Judicial Decision Making',
                'Legal Proceedings',
                'Court Administration',
                safeJurisdiction + ' Law'
              ],
              url: `https://judgefinder.io/judges/${params.slug}`,
              sameAs: judge.courtlistener_id ? [
                `https://www.courtlistener.com/person/${judge.courtlistener_id}/`
              ] : undefined
            },
            // Legal Service Schema
            {
              '@context': 'https://schema.org',
              '@type': 'LegalService',
              '@id': 'https://judgefinder.io#legalservice',
              name: 'JudgeFinder - Legal Analytics Platform',
              description: 'Comprehensive judicial analytics and legal research platform for attorneys and legal professionals',
              url: 'https://judgefinder.io',
              serviceType: 'Legal Research and Analytics',
              areaServed: {
                '@type': 'State',
                name: 'California'
              },
              audience: {
                '@type': 'Audience',
                audienceType: 'Legal Professionals'
              },
              serviceOutput: {
                '@type': 'Dataset',
                name: 'Judicial Analytics and Case Outcomes'
              }
            },
            // WebPage Schema
            {
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              '@id': `https://judgefinder.io/judges/${params.slug}`,
              name: `${judge.name} - Judicial Profile | JudgeFinder`,
              description: `Research ${judge.name} from ${judge.court_name}. View ruling patterns, decision trends, reversal rates, and comprehensive judicial analytics.`,
              url: `https://judgefinder.io/judges/${params.slug}`,
              isPartOf: {
                '@type': 'WebSite',
                '@id': 'https://judgefinder.io#website',
                name: 'JudgeFinder',
                url: 'https://judgefinder.io'
              },
              about: {
                '@id': `https://judgefinder.io/judges/${params.slug}#judge`
              },
              mainEntity: {
                '@id': `https://judgefinder.io/judges/${params.slug}#judge`
              }
            }
          ]),
        }}
      />
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 px-4 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 text-sm font-medium text-gray-300">
            Home / Judges / {safeJurisdiction} / {safeName}
          </div>
          <h1 className="mb-2 text-4xl font-bold">{safeName}</h1>
          <p className="text-xl text-gray-300">{safeCourtName}</p>
        </div>
      </div>

      {/* Attorney Directory Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Are you an attorney with experience before Judge {safeName}?</h2>
              <p className="mt-1 text-blue-100">Join our educational attorney directory to help legal professionals find qualified counsel</p>
            </div>
            <a 
              href="#attorney-slots" 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Join Directory →
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Profile and Patterns */}
          <div className="lg:col-span-2 space-y-8">
            <JudgeProfile judge={judge} />
            <AnalyticsSliders judgeId={judge.id} judgeName={safeName} />
            <RecentDecisions judgeId={judge.id} />
          </div>

          {/* Right Column - Attorney Directory and FAQ */}
          <div className="space-y-8">
            <div id="attorney-slots">
              <AttorneySlots judgeId={judge.id} judgeName={safeName} />
            </div>
            <JudgeFAQ judgeName={safeName} />
          </div>
        </div>
      </div>
    </div>
  )
}

interface MetadataProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: MetadataProps) {
  // Validate params
  if (!params.slug || typeof params.slug !== 'string') {
    return {
      title: 'Invalid Request | JudgeFinder',
      description: 'The requested page is invalid. Please check the URL and try again.',
    }
  }

  const judge = await getJudge(params.slug)
  
  if (!judge) {
    return {
      title: 'Judge Not Found | JudgeFinder',
      description: 'The requested judge profile could not be found. Search our database of 1,061+ California judges.',
      robots: 'noindex, nofollow' // Don't index 404 pages
    }
  }

  // Additional safety checks for metadata generation
  const safeName = judge.name || 'Unknown Judge'
  const safeCourtName = judge.court_name || 'Unknown Court'
  const safeJurisdiction = judge.jurisdiction || 'Unknown Jurisdiction'

  // Extract court type for SEO targeting
  const courtType = safeCourtName.includes('Superior') ? 'Superior Court' : 
                   safeCourtName.includes('Appeal') ? 'Court of Appeal' :
                   safeCourtName.includes('Supreme') ? 'Supreme Court' :
                   safeCourtName.includes('Federal') ? 'Federal Court' : 'Court'

  // Calculate years of service for meta description
  let yearsExperience = ''
  if (judge.appointed_date) {
    try {
      const years = new Date().getFullYear() - new Date(judge.appointed_date).getFullYear()
      yearsExperience = years > 0 ? ` with ${years}+ years judicial experience` : ''
    } catch (dateError) {
      console.warn('Invalid appointed_date format:', judge.appointed_date)
    }
  }

  // Legal-focused meta description
  const description = `Research Judge ${safeName} serving ${safeCourtName} in ${safeJurisdiction}${yearsExperience}. View judicial analytics, ruling patterns, case outcomes & find experienced attorneys in our legal directory. Essential legal intelligence for case strategy.`

  return {
    title: `Judge ${safeName} - ${safeCourtName} | JudgeFinder`,
    description: description,
    keywords: [
      `Judge ${safeName}`,
      `${safeName} ${safeCourtName}`,
      `${safeName} judicial analytics`,
      `${safeCourtName} judges`,
      `${safeJurisdiction} ${courtType}`,
      `${safeName} ruling patterns`,
      `${safeName} case outcomes`,
      'judicial research',
      'legal analytics',
      'attorney directory',
      'case strategy'
    ].join(', '),
    alternates: {
      canonical: `/judges/${params.slug}`,
    },
    openGraph: {
      title: `Judge ${safeName} - ${safeCourtName}`,
      description: `Professional judicial profile and analytics for ${safeName}. Research ruling patterns, case outcomes, and find qualified attorneys.`,
      type: 'profile',
      url: `https://judgefinder.io/judges/${params.slug}`,
      siteName: 'JudgeFinder',
      images: [
        {
          url: '/og-judge-profile.png',
          width: 1200,
          height: 630,
          alt: `Judge ${safeName} Profile - JudgeFinder`
        }
      ],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Judge ${safeName} - ${safeCourtName}`,
      description: `Research ${safeName}'s judicial analytics and case outcomes on JudgeFinder`,
      images: ['/twitter-judge-profile.png'],
    },
    authors: [{ name: 'JudgeFinder Legal Research Team' }],
    category: 'Legal Research',
    classification: 'Legal Analytics Platform',
  }
}

// Enable ISR for judge pages
export const revalidate = 3600