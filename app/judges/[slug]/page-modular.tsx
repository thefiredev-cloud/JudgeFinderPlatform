import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createCanonicalSlug } from '@/lib/utils/slug'
import { getBaseUrl } from '@/lib/utils/baseUrl'
import { SEOMonitoring } from '@/components/analytics/SEOMonitoring'
import { SEOBreadcrumbs } from '@/components/seo/SEOBreadcrumbs'
import { RelatedJudges } from '@/components/seo/RelatedJudges'
import { GoogleAd } from '@/components/ads/GoogleAd'
import { JudgeStructuredData } from '@/components/judges/profile/JudgeStructuredData'
import { JudgeHeroSection } from '@/components/judges/profile/JudgeHeroSection'
import { AttorneyDirectoryBanner } from '@/components/judges/profile/AttorneyDirectoryBanner'
import { JudgeMainContent } from '@/components/judges/profile/JudgeMainContent'
import { JudgeFAQSection } from '@/components/judges/profile/JudgeFAQSection'
import type { Judge } from '@/types'

// Helper function to get coordinates for jurisdiction
function getCoordinatesForJurisdiction(jurisdiction: string): string {
  const coordinates: Record<string, string> = {
    'CA': '36.7783,-119.4179',
    'California': '36.7783,-119.4179',
    'Orange County': '33.7175,-117.8311',
    'Los Angeles': '34.0522,-118.2437',
    'San Francisco': '37.7749,-122.4194',
    'San Diego': '32.7157,-117.1611',
    'Sacramento': '38.5816,-121.4944',
    'Fresno': '36.7378,-119.7871',
    'Long Beach': '33.7701,-118.1937',
    'Oakland': '37.8044,-122.2711',
    'Bakersfield': '35.3732,-119.0187',
    'Anaheim': '33.8366,-117.9143',
    'Santa Ana': '33.7455,-117.8677',
    'Riverside': '33.9533,-117.3962',
    'Stockton': '37.9577,-121.2908',
    'Irvine': '33.6846,-117.8265',
    'Chula Vista': '32.6401,-117.0842',
    'Fremont': '37.5485,-121.9886',
    'San Bernardino': '34.1083,-117.2898',
    'Modesto': '37.6391,-120.9969'
  }
  
  return coordinates[jurisdiction] || coordinates['CA'] || '36.7783,-119.4179'
}

// Enhanced judge fetching function with comprehensive error handling
async function getJudge(slug: string): Promise<Judge | null> {
  try {
    const { createServerClient } = await import('@/lib/supabase/server')
    const supabase = await createServerClient()
    
    // Multiple query strategies for robust judge lookup
    const { data: judges, error } = await supabase
      .from('judges')
      .select(`
        *,
        court:courts(*)
      `)
      .or(`slug.eq.${slug},name.ilike.%${decodeURIComponent(slug).replace(/-/g, ' ')}%`)
      .limit(1)
    
    if (error) {
      console.error('Database error fetching judge:', error)
      return null
    }
    
    return judges?.[0] || null
  } catch (error) {
    console.error('Error fetching judge:', error)
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

  // Check if current URL is canonical and redirect if necessary
  const canonicalSlug = judge.slug || createCanonicalSlug(judge.name)
  if (params.slug !== canonicalSlug) {
    console.log(`Redirecting from non-canonical slug ${params.slug} to canonical ${canonicalSlug}`)
    redirect(`/judges/${canonicalSlug}`)
  }

  // Safe variables for display
  const safeName = judge.name || 'Unknown Judge'
  const safeCourtName = judge.court_name || 'Unknown Court'
  const safeJurisdiction = judge.jurisdiction || 'Unknown Jurisdiction'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Monitoring and Analytics */}
      <SEOMonitoring 
        judgeName={safeName}
        jurisdiction={safeJurisdiction}
        slug={params.slug}
      />
      
      {/* Comprehensive Structured Data for SEO */}
      <JudgeStructuredData
        judge={judge}
        safeName={safeName}
        safeCourtName={safeCourtName}
        safeJurisdiction={safeJurisdiction}
        slug={params.slug}
      />

      {/* Hero Section */}
      <JudgeHeroSection
        judge={judge}
        safeName={safeName}
        safeCourtName={safeCourtName}
        safeJurisdiction={safeJurisdiction}
      />

      {/* Attorney Directory Banner */}
      <AttorneyDirectoryBanner jurisdiction={safeJurisdiction} />

      {/* SEO Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SEOBreadcrumbs 
            items={[
              { label: 'Judges', href: '/judges' },
              { 
                label: safeJurisdiction, 
                href: `/jurisdictions/${safeJurisdiction.toLowerCase().replace(/\s+/g, '-')}` 
              },
              { 
                label: safeCourtName, 
                href: `/courts/${judge.court_id || ''}` 
              },
              { 
                label: `Judge ${safeName}`, 
                href: '#', 
                current: true 
              }
            ]}
          />
        </div>
      </div>

      {/* Main Content */}
      <JudgeMainContent
        judge={judge}
        safeName={safeName}
        safeCourtName={safeCourtName}
        safeJurisdiction={safeJurisdiction}
      />

      {/* Advertisement Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GoogleAd
            slot="2345678901"
            format="rectangle"
            style={{ minHeight: '250px' }}
          />
          <GoogleAd
            slot="2345678901"
            format="rectangle"
            style={{ minHeight: '250px' }}
          />
          <GoogleAd
            slot="2345678901"
            format="rectangle"
            style={{ minHeight: '250px' }}
          />
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JudgeFAQSection
          judgeName={safeName}
          courtName={safeCourtName}
          jurisdiction={safeJurisdiction}
        />
      </div>

      {/* Related Judges for Internal Linking */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RelatedJudges 
          currentJudgeId={judge.id}
          jurisdiction={safeJurisdiction}
          courtName={judge.court_name || 'Unknown Court'}
          judgeName={judge.name || 'Unknown Judge'}
        />
      </div>
    </div>
  )
}

// Metadata generation
interface MetadataProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const judge = await getJudge(params.slug)
  
  if (!judge) {
    return {
      title: 'Judge Not Found | JudgeFinder',
      description: 'The requested judge profile could not be found.'
    }
  }

  const safeName = judge.name || 'Unknown Judge'
  const safeCourtName = judge.court_name || 'Unknown Court'
  const safeJurisdiction = judge.jurisdiction || 'Unknown Jurisdiction'
  const nameWithoutTitle = safeName.replace(/^(judge|justice|the honorable)\s+/i, '').trim()
  
  const baseUrl = getBaseUrl()
  const coordinates = getCoordinatesForJurisdiction(safeJurisdiction)
  
  return {
    title: `Judge ${nameWithoutTitle} | ${safeJurisdiction} ${safeCourtName.replace(/.*,\s*/, '')} | Complete Profile & Judicial Analytics`,
    description: `Comprehensive judicial profile for Judge ${nameWithoutTitle} serving at ${safeCourtName} in ${safeJurisdiction}. Research ruling patterns, case analytics, and judicial background for effective legal strategy.`,
    
    keywords: [
      `Judge ${nameWithoutTitle}`,
      `${nameWithoutTitle} judge`,
      `${safeCourtName}`,
      `${safeJurisdiction} judges`,
      `judicial analytics ${nameWithoutTitle}`,
      `court records ${nameWithoutTitle}`,
      `legal research ${safeJurisdiction}`,
      `case strategy ${nameWithoutTitle}`,
      `courtroom procedures`,
      `judicial patterns`,
      `legal intelligence`,
      `attorney resources ${safeJurisdiction}`
    ].join(', '),
    
    authors: [{ name: 'JudgeFinder Legal Research Team', url: `${baseUrl}/about` }],
    publisher: 'JudgeFinder',
    category: 'Legal Research and Judicial Analytics',
    classification: 'Professional Legal Intelligence Platform',
    
    openGraph: {
      title: `Judge ${nameWithoutTitle} - ${safeJurisdiction} ${safeCourtName.replace(/.*,\s*/, '')}`,
      description: `Complete judicial profile: ${nameWithoutTitle}'s analytics, ruling patterns & attorney directory. Essential legal intelligence for case strategy.`,
      url: `${baseUrl}/judges/${params.slug}`,
      siteName: 'JudgeFinder',
      locale: 'en_US',
      type: 'profile',
      images: {
        url: `${baseUrl}/api/judges/${judge.id}/profile-image`,
        width: 1200,
        height: 630,
        alt: `Judge ${nameWithoutTitle} - Judicial Profile and Legal Analytics`,
      },
    },

    twitter: {
      card: 'summary_large_image',
      site: '@JudgeFinder',
      creator: '@JudgeFinder', 
      title: `Judge ${nameWithoutTitle} - ${safeJurisdiction} ${safeCourtName.replace(/.*,\s*/, '')}`,
      description: `Complete judicial profile: ${nameWithoutTitle}'s analytics, ruling patterns & attorney directory. Essential legal intelligence for case strategy.`,
      images: {
        url: `${baseUrl}/api/judges/${judge.id}/profile-image`,
        alt: `Judge ${nameWithoutTitle} - Judicial Profile and Legal Analytics`,
      },
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    alternates: {
      canonical: `${baseUrl}/judges/${params.slug}`,
    },

    other: {
      'geo.region': 'US-CA',
      'geo.placename': safeJurisdiction,
      'geo.position': coordinates,
      'ICBM': coordinates,
    },

    // Additional metadata for rich results
    manifest: '/manifest.json',
    applicationName: 'JudgeFinder',
    referrer: 'origin-when-cross-origin',
    creator: 'JudgeFinder Legal Analytics',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  }
}

// Enable ISR for judge pages
export const revalidate = 3600
