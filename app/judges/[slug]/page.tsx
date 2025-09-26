import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { JudgeProfile } from '@/components/judges/JudgeProfile'
import { ProfessionalBackground } from '@/components/judges/ProfessionalBackground'
import { JudgeRulingPatterns } from '@/components/judges/JudgeRulingPatterns'
import { RecentDecisions } from '@/components/judges/RecentDecisions'
import { AdvertiserSlots } from '@/components/judges/AdvertiserSlots'
import { JudgeFAQ } from '@/components/judges/JudgeFAQ'
import { AnalyticsSlidersShell } from '@/components/judges/AnalyticsSlidersShell'
import { BookmarkButton } from '@/components/judges/BookmarkButton'
import { ReportProfileIssueDialog } from '@/components/judges/ReportProfileIssueDialog'
import { SEOBreadcrumbs } from '@/components/seo/SEOBreadcrumbs'
import { generateJudgeBreadcrumbs } from '@/lib/seo/breadcrumbs'
import { RelatedJudges } from '@/components/seo/RelatedJudges'
import { RelatedContent } from '@/components/seo/RelatedContent'
import { SEOMonitoring } from '@/components/analytics/SEOMonitoring'
import { isValidSlug, createCanonicalSlug, resolveCourtSlug } from '@/lib/utils/slug'
import { generateJudgeMetadata } from '@/lib/seo/metadata-generator'
import { generateJudgeStructuredData } from '@/lib/seo/structured-data'
import type { Judge, JudgeLookupResult } from '@/types'
import { getBaseUrl } from '@/lib/utils/baseUrl'

export const dynamic = 'force-dynamic'

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
    const baseUrl = getBaseUrl()

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
 * Fetch related judges for internal linking and content discovery
 */
async function getRelatedJudges(currentJudge: Judge): Promise<Judge[]> {
  try {
    const supabase = await createServerClient()
    
    const relatedJudges = []
    
    // Get judges from same court (max 3)
    if (currentJudge.court_name) {
      const { data: sameCourtJudges } = await supabase
        .from('judges')
        .select('*')
        .eq('court_name', currentJudge.court_name)
        .neq('id', currentJudge.id)
        .limit(3)
      
      if (sameCourtJudges) {
        relatedJudges.push(...sameCourtJudges)
      }
    }
    
    // Get judges from same jurisdiction (fill up to 5 total)
    if (relatedJudges.length < 5 && currentJudge.jurisdiction) {
      const { data: sameJurisdictionJudges } = await supabase
        .from('judges')
        .select('*')
        .eq('jurisdiction', currentJudge.jurisdiction)
        .neq('id', currentJudge.id)
        .not('id', 'in', `(${relatedJudges.map(j => j.id).join(',') || '0'})`)
        .limit(5 - relatedJudges.length)
      
      if (sameJurisdictionJudges) {
        relatedJudges.push(...sameJurisdictionJudges)
      }
    }
    
    return relatedJudges.slice(0, 5)
  } catch (error) {
    console.error('Error fetching related judges:', error)
    return []
  }
}

/**
 * Fallback function for direct database access when API fails
 * Simplified version of the original logic
 */
async function getJudgeFallback(slug: string): Promise<Judge | null> {
  try {
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

type SlugParams = { slug: string }

// Next.js currently passes params as a Promise that is also directly readable.
// Use an intersection type so we stay compatible with both behaviors.
type SlugParamsPromise = Promise<SlugParams> & SlugParams

interface JudgePageProps {
  params: SlugParamsPromise
}

export default async function JudgePage({ params }: JudgePageProps) {
  const resolvedParams = await params
  const slug = resolvedParams.slug ?? params.slug

  // Add param validation
  if (!slug || typeof slug !== 'string') {
    console.error('Invalid slug parameter:', slug)
    notFound()
  }

  const judge = await getJudge(slug)

  if (!judge) {
    console.log(`Judge not found for slug: ${slug}`)
    notFound()
  }

  // Additional validation to ensure we have required fields
  if (!judge.id || !judge.name) {
    console.error('Judge data is incomplete:', judge)
    notFound()
  }

  // Check if current URL is canonical and redirect if necessary
  const canonicalSlug = judge.slug || createCanonicalSlug(judge.name)
  if (slug !== canonicalSlug) {
    console.log(`Redirecting from non-canonical slug ${slug} to canonical ${canonicalSlug}`)
    redirect(`/judges/${canonicalSlug}`)
  }

  // Safe variables for display
  const safeName = judge.name || 'Unknown Judge'
  const safeCourtName = judge.court_name || 'Unknown Court'
  const safeJurisdiction = judge.jurisdiction || 'Unknown Jurisdiction'

  let courtSlug = judge.court_slug ?? null
  if (!courtSlug && judge.court_id) {
    try {
      const supabase = await createServerClient()
      const { data: courtRecord } = await supabase
        .from('courts')
        .select('slug, name')
        .eq('id', judge.court_id)
        .maybeSingle()

      if (courtRecord) {
        courtSlug = resolveCourtSlug(courtRecord)
      }
    } catch (error) {
      console.warn('Failed to resolve court slug for judge', {
        judgeId: judge.id,
        error: error instanceof Error ? error.message : error
      })
    }
  }

  if (!courtSlug && judge.court_name) {
    courtSlug = resolveCourtSlug({ name: judge.court_name })
  }

  const baseUrl = getBaseUrl()

  // Precompute structured data JSON defensively so errors don't break the page render.
  let structuredDataJson = '[]'

  try {
    structuredDataJson = JSON.stringify(
      generateJudgeStructuredData(judge, canonicalSlug, baseUrl)
    )
  } catch (error) {
    console.error('Failed to generate structured data JSON for judge', {
      slug: canonicalSlug,
      message: error instanceof Error ? error.message : error
    })
    structuredDataJson = '[]'
  }

  // Fetch related judges for internal linking
  const relatedJudges = await getRelatedJudges(judge)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* SEO Monitoring and Analytics */}
      <SEOMonitoring 
        judgeName={safeName}
        jurisdiction={safeJurisdiction}
        slug={slug}
      />
      
      {/* Enhanced Comprehensive Structured Data for Maximum SEO Dominance */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: structuredDataJson
        }}
      />
      
      {/* SEO Breadcrumbs - Moved to top for better visibility */}
      <SEOBreadcrumbs 
        items={generateJudgeBreadcrumbs(safeName, safeJurisdiction, safeCourtName, courtSlug)}
        judgeName={safeName}
        jurisdiction={safeJurisdiction}
      />
      
      {/* Hero Section with Enhanced Gradient */}
      <div className="bg-gradient-to-br from-enterprise-primary/20 via-enterprise-deep/10 to-background px-4 py-12 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="mx-auto max-w-7xl relative z-10">
          <h1 className="mb-2 text-4xl md:text-5xl font-bold bg-gradient-to-r from-enterprise-primary to-enterprise-deep bg-clip-text text-transparent">
            Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')} - {safeJurisdiction} {safeCourtName.includes('Superior') ? 'Superior Court' : 'Court'} Judge
          </h1>
          <p className="text-xl text-muted-foreground">
            {safeCourtName} • Official Judicial Profile & Analytics
            {judge.appointed_date && (() => {
              try {
                const years = new Date().getFullYear() - new Date(judge.appointed_date).getFullYear()
                return years > 0 ? ` • ${years}+ Years Experience` : ''
              } catch {
                return ''
              }
            })()}
          </p>
        </div>
      </div>


      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Profile and Analytics */}
          <div className="lg:col-span-2 space-y-8">
            {/* Clean Profile Card */}
            <JudgeProfile judge={judge} />
            
            {/* Professional Background Section */}
            <section id="professional-background" className="scroll-mt-32">
              <ProfessionalBackground judge={judge} />
            </section>
            
            {/* AI Analytics Section */}
            <section id="analytics" className="scroll-mt-32">
              <AnalyticsSlidersShell judgeId={judge.id} judgeName={safeName} />
            </section>
            
            {/* Recent Decisions */}
            <section id="recent-decisions" className="scroll-mt-32">
              <RecentDecisions judgeId={judge.id} />
            </section>
          </div>

          {/* Right Column - Sidebar Content */}
          <div className="space-y-8">
            {/* Legal Professionals Section */}
            <div id="advertiser-slots">
              <AdvertiserSlots judgeId={judge.id} judgeName={safeName} />
            </div>
            
            {/* Related Content System for Internal Linking */}
            <RelatedContent 
              currentJudge={judge}
              relatedJudges={relatedJudges}
              jurisdiction={safeJurisdiction}
              courtName={safeCourtName}
              courtSlug={courtSlug}
            />
            
            <JudgeFAQ judgeName={safeName} />
          </div>
        </div>
      </div>

      <ReportProfileIssueDialog judgeSlug={canonicalSlug} courtId={judge.court_id} />
    </div>
  )
}

/**
 * Get approximate coordinates for California jurisdictions for local SEO
 */
function getCoordinatesForJurisdiction(jurisdiction: string): string {
  const coords: Record<string, string> = {
    'Orange County': '33.7175,-117.8311',
    'Los Angeles County': '34.0522,-118.2437',
    'San Diego County': '32.7157,-117.1611',
    'Riverside County': '33.7537,-116.3017',
    'San Bernardino County': '34.1083,-117.2898',
    'Ventura County': '34.3705,-119.1391',
    'Santa Barbara County': '34.4208,-119.6982',
    'Kern County': '35.3732,-119.0187',
    'Fresno County': '36.7378,-119.7871',
    'Tulare County': '36.2077,-118.8597',
    'Imperial County': '32.8313,-115.5631',
    'Inyo County': '36.8055,-118.0623',
    'Mono County': '37.8085,-119.0003',
    'Kings County': '36.1015,-119.7739',
    'Madera County': '37.0528,-119.7704',
    'Merced County': '37.3022,-120.4829',
    'San Joaquin County': '37.9577,-121.2908',
    'Stanislaus County': '37.5574,-120.9944',
    'Santa Clara County': '37.3541,-121.9552',
    'Alameda County': '37.6017,-121.7195',
    'Contra Costa County': '37.9161,-121.9018',
    'San Francisco County': '37.7749,-122.4194',
    'San Mateo County': '37.5630,-122.3255',
    'Santa Cruz County': '36.9741,-122.0308',
    'Monterey County': '36.4177,-121.7795',
    'San Luis Obispo County': '35.2827,-120.6596',
    'Sacramento County': '38.7816,-121.4944',
    'Yolo County': '38.7646,-121.9018',
    'Solano County': '38.4404,-121.8735',
    'Napa County': '38.5025,-122.2654',
    'Sonoma County': '38.5816,-122.8678',
    'Marin County': '38.0834,-122.7633',
    'Lake County': '39.0840,-122.8084',
    'Mendocino County': '39.3070,-123.4177',
    'Humboldt County': '40.4459,-124.2026',
    'Del Norte County': '41.7443,-124.1169',
    'Siskiyou County': '41.5948,-122.6136',
    'Modoc County': '41.5449,-120.3653',
    'Lassen County': '40.4781,-120.5542',
    'Plumas County': '39.8771,-120.8039',
    'Sierra County': '39.5796,-120.5135',
    'Nevada County': '39.2658,-121.0159',
    'Placer County': '39.0916,-120.8039',
    'El Dorado County': '38.7494,-120.6596',
    'Alpine County': '38.7580,-119.8489',
    'Amador County': '38.4166,-120.6596',
    'Calaveras County': '38.1191,-120.5542',
    'Tuolumne County': '37.9499,-120.2324',
    'Mariposa County': '37.4849,-119.9464',
    'California': '36.7783,-119.4179', // State center
  }
  
  return coords[jurisdiction] || coords['California'] || '36.7783,-119.4179'
}

interface MetadataProps {
  params: SlugParamsPromise
}

export async function generateMetadata({ params }: MetadataProps) {
  const resolvedParams = await params
  const slug = resolvedParams.slug ?? params.slug

  // Validate params
  if (!slug || typeof slug !== 'string') {
    return {
      title: 'Invalid Request | JudgeFinder',
      description: 'The requested page is invalid. Please check the URL and try again.',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const judge = await getJudge(slug)
  
  if (!judge) {
    return {
      title: 'Judge Not Found | JudgeFinder',
      description: 'The requested judge profile could not be found. Search our statewide database of California judges.',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  // Generate enhanced SEO metadata using the advanced generator
  const baseUrl = getBaseUrl()

  const seoData = generateJudgeMetadata(judge, resolvedParams, baseUrl)
  
  // Additional safety checks for metadata generation
  const safeName = judge.name || 'Unknown Judge'
  const safeCourtName = judge.court_name || 'Unknown Court'
  const safeJurisdiction = judge.jurisdiction || 'Unknown Jurisdiction'

  // Extract name components for social sharing
  const nameWithoutTitle = safeName.replace(/^(judge|justice|the honorable)\s+/i, '').trim()
  const nameParts = nameWithoutTitle.split(' ').filter(part => part.length > 1)
  const firstName = nameParts[0] || ''
  const lastName = nameParts[nameParts.length - 1] || ''

  // Calculate canonical slug for metadata
  const canonicalSlug = judge.slug || createCanonicalSlug(judge.name)
  
  // Determine court type for metadata
  const courtType = safeCourtName.includes('Superior') 
    ? 'Superior Court' 
    : safeCourtName.includes('Appellate') || safeCourtName.includes('Appeal')
      ? 'Appellate Court'
      : safeCourtName.includes('Supreme')
        ? 'Supreme Court'
        : 'Trial Court'
  
  // Calculate years of service for additional metadata
  let serviceYears = 0
  if (judge.appointed_date) {
    try {
      serviceYears = new Date().getFullYear() - new Date(judge.appointed_date).getFullYear()
    } catch (dateError) {
      console.warn('Invalid appointed_date format:', judge.appointed_date)
    }
  }

  return {
    title: seoData.title,
    description: seoData.description,
    keywords: seoData.keywords.join(', '),
    
    // Canonical and alternate URLs for SEO authority
    alternates: {
      canonical: seoData.canonicalUrl,
      languages: {
        'en-US': seoData.canonicalUrl,
      },
    },
    
    // Optimized robots directives for maximum visibility
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Social sharing optimized OpenGraph
    openGraph: {
      title: seoData.socialTitle,
      description: seoData.socialDescription,
      type: 'profile',
      url: seoData.canonicalUrl,
      siteName: 'JudgeFinder - California Judicial Analytics',
      images: [
        {
          url: `${baseUrl}/og-judge-profile.png`,
          width: 1200,
          height: 630,
          alt: `Judge ${nameWithoutTitle} - Official Judicial Profile and Analytics`,
          type: 'image/png',
        },
        {
          url: `${baseUrl}/og-judge-square.png`,
          width: 1200,
          height: 1200,
          alt: `Judge ${nameWithoutTitle} Profile`,
          type: 'image/png',
        }
      ],
      locale: 'en_US',
      countryName: 'United States',
      emails: ['contact@judgefinder.io'],
      profile: {
        firstName: firstName,
        lastName: lastName,
        username: canonicalSlug,
      },
    },

    // Twitter optimized for legal professionals
    twitter: {
      card: 'summary_large_image',
      site: '@JudgeFinder',
      creator: '@JudgeFinder', 
      title: seoData.socialTitle,
      description: seoData.socialDescription,
      images: {
        url: `${baseUrl}/twitter-judge-profile.png`,
        alt: `Judge ${nameWithoutTitle} - Judicial Profile and Legal Analytics`,
      },
    },

    // Enhanced metadata for legal authority
    authors: [{ name: 'JudgeFinder Legal Research Team', url: `${baseUrl}/about` }],
    publisher: 'JudgeFinder',
    category: 'Legal Research and Judicial Analytics',
    classification: 'Professional Legal Intelligence Platform',
    
    // Advanced SEO and verification tags
    other: {
      // Technical SEO
      'theme-color': '#1f2937',
      'color-scheme': 'light dark',
      'format-detection': 'telephone=no',
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      
      // Rich snippets and schema coordination
      'article:author': 'JudgeFinder Legal Research Team',
      'article:section': 'Judicial Profiles and Legal Analytics',
      'article:tag': `Judge ${nameWithoutTitle}, ${safeCourtName}, ${safeJurisdiction}, Judicial Analytics`,
      'article:published_time': judge.appointed_date || new Date().toISOString(),
      'article:modified_time': new Date().toISOString(),
      
      // Professional legal metadata
      'judge:name': nameWithoutTitle,
      'judge:title': `The Honorable ${nameWithoutTitle}`,
      'judge:court': safeCourtName,
      'judge:jurisdiction': safeJurisdiction,
      'judge:court-type': courtType,
      'judge:canonical-slug': canonicalSlug,
      'judge:service-years': serviceYears.toString(),
      'judge:appointed-date': judge.appointed_date || '',
      
      // Geo-targeting for local SEO
      'geo.region': 'US-CA',
      'geo.placename': safeJurisdiction,
      'ICBM': getCoordinatesForJurisdiction(safeJurisdiction),
      'geo.position': getCoordinatesForJurisdiction(safeJurisdiction),
      
      // Legal industry targeting
      'industry': 'Legal Services',
      'audience': 'Legal Professionals, Attorneys, Citizens',
      'content-language': 'en-US',
      'distribution': 'global',
      'rating': 'general',
      
      // Verification and analytics
      'google-site-verification': process.env.GOOGLE_SITE_VERIFICATION || '',
      'msvalidate.01': process.env.BING_SITE_VERIFICATION || '',
      
      // Voice search optimization
      'speakable': 'true',
      'voice-search-optimized': 'true',
      
      // Professional credentials and authority
      'legal-resource': 'true',
      'judicial-profile': 'true',
      'court-verified': 'true',
      'professional-grade': 'true',
      
      // International and accessibility
      'hreflang': 'en-us',
      'language': 'English',
      'charset': 'UTF-8',
    },

    // Verification metadata for search engines
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || '',
      yandex: process.env.YANDEX_VERIFICATION || '',
      yahoo: process.env.YAHOO_VERIFICATION || '',
      other: {
        'msvalidate.01': process.env.BING_SITE_VERIFICATION || '',
      }
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

/**
 * Generate alternate URLs for different judge name variations
 * Helps with SEO and provides alternate formats that might be searched
 */
function generateJudgeUrlVariations(judgeName: string, baseUrl: string): string[] {
  const baseName = judgeName.replace(/^(judge|justice|the honorable)\s+/i, '')
  const canonicalSlug = createCanonicalSlug(baseName)
  
  const variations = [
    `${baseUrl}/judges/${canonicalSlug}`,
    `${baseUrl}/judges/judge-${canonicalSlug}`,
    `${baseUrl}/judges/honorable-${canonicalSlug}`,
  ]

  // Add variations without middle names/initials for common search patterns
  const nameParts = baseName.split(' ').filter(part => part.length > 1)
  if (nameParts.length > 2) {
    const firstLast = `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
    const firstLastSlug = createCanonicalSlug(firstLast)
    variations.push(`${baseUrl}/judges/${firstLastSlug}`)
  }

  // Remove duplicates and return
  return [...new Set(variations)]
}

// Enable ISR for judge pages
// Disable ISR for judge pages to avoid stale HTML serving old asset hashes
export const revalidate = 0
