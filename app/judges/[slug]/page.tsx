import { notFound, redirect } from 'next/navigation'
import { JudgeProfile } from '@/components/judges/JudgeProfile'
import { JudgeRulingPatterns } from '@/components/judges/JudgeRulingPatterns'
import { RecentDecisions } from '@/components/judges/RecentDecisions'
import { AttorneySlots } from '@/components/judges/AttorneySlots'
import { JudgeFAQ } from '@/components/judges/JudgeFAQ'
import AnalyticsSliders from '@/components/judges/AnalyticsSliders'
import { LazyGoogleAd } from '@/components/ads/GoogleAd'
import { SEOBreadcrumbs } from '@/components/seo/SEOBreadcrumbs'
import { RelatedJudges } from '@/components/seo/RelatedJudges'
import { SEOMonitoring } from '@/components/analytics/SEOMonitoring'
import { isValidSlug, createCanonicalSlug } from '@/lib/utils/slug'
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
      
      {/* Comprehensive Structured Data for SEO Dominance */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            // Enhanced Judge Person Schema - Comprehensive Profile
            {
              '@context': 'https://schema.org',
              '@type': ['Person', 'PublicOfficial'],
              '@id': `https://judgefinder.io/judges/${canonicalSlug}#judge`,
              name: safeName,
              alternateName: judge.name !== safeName ? [judge.name] : undefined,
              honorificPrefix: 'The Honorable',
              jobTitle: ['Judge', 'Judicial Officer', 'Superior Court Judge'],
              description: judge.bio || `The Honorable ${safeName} is a distinguished judicial officer serving ${safeCourtName} in ${safeJurisdiction}. Access comprehensive judicial analytics, ruling patterns, case outcomes, and professional background information.`,
              disambiguatingDescription: `California Superior Court Judge serving ${safeCourtName}. Judicial analytics and case outcome data available for legal research and case strategy.`,
              
              // Professional Details
              worksFor: {
                '@type': ['Organization', 'GovernmentOrganization', 'LegalService'],
                '@id': `https://judgefinder.io/courts/${safeCourtName.toLowerCase().replace(/\s+/g, '-')}#organization`,
                name: safeCourtName,
                legalName: safeCourtName,
                description: `${safeCourtName} - California Superior Court serving ${safeJurisdiction}`,
                address: {
                  '@type': 'PostalAddress',
                  addressRegion: safeJurisdiction,
                  addressCountry: 'US'
                },
                url: `https://judgefinder.io/courts/${safeCourtName.toLowerCase().replace(/\s+/g, '-')}`,
                serviceArea: {
                  '@type': 'State',
                  name: 'California'
                }
              },

              // Educational Background
              alumniOf: judge.education ? judge.education.split(';').map(edu => ({
                '@type': 'EducationalOrganization',
                name: edu.trim(),
                description: `Legal education institution where ${safeName} received training`
              })) : [
                {
                  '@type': 'EducationalOrganization',
                  name: 'Law School',
                  description: `Legal education background for ${safeName}`
                }
              ],

              // Professional Competencies
              knowsAbout: [
                'Judicial Decision Making',
                'Legal Proceedings',
                'Court Administration',
                'Civil Litigation',
                'Criminal Law',
                'Family Law',
                'Constitutional Law',
                'California State Law',
                safeJurisdiction + ' Law',
                'Legal Precedent',
                'Case Management',
                'Judicial Ethics',
                'Evidence Law',
                'Procedural Law'
              ],

              // Professional Attributes
              hasOccupation: {
                '@type': 'Occupation',
                name: 'Superior Court Judge',
                description: 'Judicial officer presiding over legal proceedings and making legal determinations',
                occupationLocation: {
                  '@type': 'Place',
                  name: safeJurisdiction
                },
                responsibilities: [
                  'Presiding over legal proceedings',
                  'Making judicial determinations',
                  'Ensuring fair legal process',
                  'Interpreting and applying law'
                ]
              },

              // Appointment Information
              dateCreated: judge.appointed_date ? judge.appointed_date : undefined,
              startDate: judge.appointed_date ? judge.appointed_date : undefined,

              // External References
              url: `https://judgefinder.io/judges/${canonicalSlug}`,
              sameAs: [
                ...(judge.courtlistener_id ? [`https://www.courtlistener.com/person/${judge.courtlistener_id}/`] : []),
                `https://judgefinder.io/judges/${canonicalSlug}`,
                // Add potential official court website reference
                `https://www.courts.ca.gov/`,
              ].filter(Boolean),

              // Professional Recognition
              award: [
                'Judicial Appointment',
                'California Superior Court Commission'
              ],

              // Contact/Professional Information
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'judicial office',
                description: `Official judicial contact through ${safeCourtName}`
              }
            },

            // BreadcrumbList Schema for Navigation
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              '@id': `https://judgefinder.io/judges/${canonicalSlug}#breadcrumb`,
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
                  name: 'Judges',
                  item: 'https://judgefinder.io/judges'
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: safeJurisdiction,
                  item: `https://judgefinder.io/jurisdictions/${safeJurisdiction.toLowerCase().replace(/\s+/g, '-')}`
                },
                {
                  '@type': 'ListItem',
                  position: 4,
                  name: safeName,
                  item: `https://judgefinder.io/judges/${canonicalSlug}`
                }
              ]
            },

            // FAQPage Schema for People Also Ask
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              '@id': `https://judgefinder.io/judges/${canonicalSlug}#faq`,
              mainEntity: [
                {
                  '@type': 'Question',
                  name: `Who is Judge ${safeName}?`,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: `The Honorable ${safeName} is a Superior Court Judge serving ${safeCourtName} in ${safeJurisdiction}. ${judge.bio || `Judge ${safeName} presides over various legal matters and has established a judicial record that can be researched through comprehensive analytics and case outcome data.`}`
                  }
                },
                {
                  '@type': 'Question',
                  name: `What court does Judge ${safeName} serve?`,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: `Judge ${safeName} serves at ${safeCourtName} in ${safeJurisdiction}, California. This court handles various civil, criminal, and family law matters within its jurisdiction.`
                  }
                },
                {
                  '@type': 'Question',
                  name: `How can I research Judge ${safeName}'s ruling patterns?`,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: `You can research Judge ${safeName}'s judicial analytics, ruling patterns, and case outcomes through JudgeFinder's comprehensive database. Our platform provides insights into decision trends, case types, and other relevant judicial data for legal research and case strategy.`
                  }
                },
                {
                  '@type': 'Question',
                  name: `When was Judge ${safeName} appointed?`,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: judge.appointed_date ? 
                      `Judge ${safeName} was appointed on ${new Date(judge.appointed_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.` :
                      `Information about Judge ${safeName}'s appointment date is available through official court records and judicial databases.`
                  }
                },
                {
                  '@type': 'Question',
                  name: `What is Judge ${safeName}'s background?`,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: judge.education ? 
                      `Judge ${safeName}'s educational background includes ${judge.education}. Additional professional background and career information can be found in the comprehensive judicial profile.` :
                      `Judge ${safeName} has a distinguished legal background leading to their appointment to ${safeCourtName}. Detailed background information is available through judicial records and professional databases.`
                  }
                },
                {
                  '@type': 'Question',
                  name: `How do I find attorneys with experience before Judge ${safeName}?`,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: `JudgeFinder maintains a directory of qualified attorneys with experience appearing before Judge ${safeName}. Our attorney directory helps connect legal professionals with relevant court experience for effective case strategy and representation.`
                  }
                }
              ]
            },

            // Court LocalBusiness Schema
            {
              '@context': 'https://schema.org',
              '@type': ['LocalBusiness', 'GovernmentOffice', 'LegalService'],
              '@id': `https://judgefinder.io/courts/${safeCourtName.toLowerCase().replace(/\s+/g, '-')}#localbusiness`,
              name: safeCourtName,
              description: `${safeCourtName} - California Superior Court serving ${safeJurisdiction} with comprehensive judicial services including civil, criminal, and family law proceedings.`,
              address: {
                '@type': 'PostalAddress',
                addressRegion: safeJurisdiction,
                addressCountry: 'US'
              },
              serviceArea: {
                '@type': 'AdministrativeArea',
                name: safeJurisdiction
              },
              employee: {
                '@id': `https://judgefinder.io/judges/${canonicalSlug}#judge`
              },
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Judicial Services',
                itemListElement: [
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Civil Litigation Proceedings',
                      description: 'Civil court proceedings and dispute resolution'
                    }
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Criminal Law Proceedings',
                      description: 'Criminal court proceedings and justice administration'
                    }
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'Family Law Proceedings',
                      description: 'Family court proceedings and domestic relations matters'
                    }
                  }
                ]
              }
            },

            // Enhanced Legal Service Schema
            {
              '@context': 'https://schema.org',
              '@type': 'LegalService',
              '@id': 'https://judgefinder.io#legalservice',
              name: 'JudgeFinder - Comprehensive Judicial Analytics Platform',
              description: `Professional judicial research and analytics platform providing comprehensive data on California judges including ${safeName}. Essential legal intelligence for attorneys, legal professionals, and citizens researching judicial patterns and case outcomes.`,
              url: 'https://judgefinder.io',
              logo: 'https://judgefinder.io/logo.png',
              serviceType: ['Legal Research and Analytics', 'Judicial Data Platform', 'Legal Intelligence Service'],
              provider: {
                '@type': 'Organization',
                name: 'JudgeFinder',
                description: 'Leading provider of judicial analytics and legal research data'
              },
              areaServed: [
                {
                  '@type': 'State',
                  name: 'California'
                },
                {
                  '@type': 'AdministrativeArea',
                  name: safeJurisdiction
                }
              ],
              audience: [
                {
                  '@type': 'Audience',
                  audienceType: 'Legal Professionals'
                },
                {
                  '@type': 'Audience',
                  audienceType: 'Attorneys'
                },
                {
                  '@type': 'Audience',
                  audienceType: 'Legal Researchers'
                },
                {
                  '@type': 'Audience',
                  audienceType: 'Citizens'
                }
              ],
              serviceOutput: [
                {
                  '@type': 'Dataset',
                  name: 'Judicial Analytics and Case Outcomes',
                  description: 'Comprehensive database of judicial decisions and case patterns'
                },
                {
                  '@type': 'Dataset',
                  name: 'Attorney Directory',
                  description: 'Directory of qualified attorneys with court-specific experience'
                }
              ],
              offers: {
                '@type': 'Offer',
                description: 'Free access to judicial analytics and attorney directory services',
                price: '0',
                priceCurrency: 'USD'
              }
            },

            // Enhanced WebPage Schema
            {
              '@context': 'https://schema.org',
              '@type': ['WebPage', 'ProfilePage'],
              '@id': `https://judgefinder.io/judges/${canonicalSlug}`,
              name: `Judge ${safeName} - Judicial Profile & Analytics | JudgeFinder`,
              description: `Comprehensive judicial profile for The Honorable ${safeName} serving ${safeCourtName} in ${safeJurisdiction}. Research ruling patterns, case outcomes, judicial analytics, and find qualified attorneys with court experience. Essential legal intelligence for case strategy.`,
              url: `https://judgefinder.io/judges/${canonicalSlug}`,
              inLanguage: 'en-US',
              isPartOf: {
                '@type': 'WebSite',
                '@id': 'https://judgefinder.io#website',
                name: 'JudgeFinder - California Judicial Analytics Platform',
                url: 'https://judgefinder.io',
                description: 'Comprehensive judicial research platform for California courts and judges'
              },
              about: {
                '@id': `https://judgefinder.io/judges/${canonicalSlug}#judge`
              },
              mainEntity: {
                '@id': `https://judgefinder.io/judges/${canonicalSlug}#judge`
              },
              breadcrumb: {
                '@id': `https://judgefinder.io/judges/${canonicalSlug}#breadcrumb`
              },
              hasPart: [
                {
                  '@type': 'WebPageElement',
                  name: 'Judicial Profile',
                  description: `Professional profile and background information for Judge ${safeName}`
                },
                {
                  '@type': 'WebPageElement',
                  name: 'Ruling Analytics',
                  description: 'Comprehensive analysis of judicial decisions and case outcomes'
                },
                {
                  '@type': 'WebPageElement',
                  name: 'Attorney Directory',
                  description: 'Directory of qualified attorneys with experience before this judge'
                }
              ],
              keywords: [
                `Judge ${safeName}`,
                `${safeName} Superior Court`,
                `${safeName} judicial analytics`,
                `${safeCourtName} judges`,
                `${safeJurisdiction} Superior Court`,
                'judicial research',
                'legal analytics',
                'case outcomes',
                'ruling patterns',
                'attorney directory'
              ].join(', '),
              dateModified: new Date().toISOString(),
              publisher: {
                '@type': 'Organization',
                name: 'JudgeFinder',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://judgefinder.io/logo.png'
                }
              }
            },

            // Organization Schema for Website Authority
            {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              '@id': 'https://judgefinder.io#organization',
              name: 'JudgeFinder',
              legalName: 'JudgeFinder Legal Analytics Platform',
              description: 'Leading provider of judicial analytics, legal research data, and attorney directory services for California courts and legal professionals.',
              url: 'https://judgefinder.io',
              logo: 'https://judgefinder.io/logo.png',
              foundingDate: '2024',
              areaServed: {
                '@type': 'State',
                name: 'California'
              },
              knowsAbout: [
                'Judicial Analytics',
                'Legal Research',
                'Court Data',
                'Attorney Directory Services',
                'Case Outcome Analysis',
                'Judicial Decision Patterns'
              ],
              serviceType: 'Legal Technology Platform',
              target: 'Legal Professionals and Citizens'
            }
          ].filter(Boolean)),
        }}
      />
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 px-4 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 text-sm font-medium text-gray-300">
            Home / Judges / {safeJurisdiction} / {safeName}
          </div>
          <h1 className="mb-2 text-4xl font-bold">
            Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')} - {safeJurisdiction} {safeCourtName.includes('Superior') ? 'Superior Court' : 'Court'} Judge
          </h1>
          <p className="text-xl text-gray-300">
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

      {/* Attorney Directory Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Attorneys with Experience Before Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')} - {safeCourtName}
              </h2>
              <p className="mt-1 text-blue-100">
                Connect with qualified legal professionals who have appeared before Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')} in {safeJurisdiction}. Essential attorney directory for case strategy and legal representation.
              </p>
            </div>
            <a 
              href="#attorney-slots" 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg whitespace-nowrap"
            >
              View Attorneys →
            </a>
          </div>
        </div>
      </div>

      {/* SEO Breadcrumbs */}
      <SEOBreadcrumbs 
        items={[
          { label: 'Judges', href: '/judges' },
          { label: safeJurisdiction, href: `/jurisdictions/${safeJurisdiction.toLowerCase().replace(/\s+/g, '-')}` },
          { label: safeCourtName, href: `/courts/${safeCourtName.toLowerCase().replace(/\s+/g, '-')}` },
          { label: `Judge ${safeName}`, href: '#', current: true }
        ]}
        judgeName={safeName}
        jurisdiction={safeJurisdiction}
      />


      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Profile and Patterns */}
          <div className="lg:col-span-2 space-y-8">
            {/* SEO Content Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                About Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')} - Professional Background & Judicial Profile
              </h2>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="mb-4">
                  The Honorable {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')} serves as a distinguished judicial officer at {safeCourtName} in {safeJurisdiction}, California. 
                  {judge.appointed_date && (() => {
                    try {
                      const appointmentDate = new Date(judge.appointed_date)
                      const years = new Date().getFullYear() - appointmentDate.getFullYear()
                      return years > 0 ? ` With ${years}+ years of judicial experience since their appointment in ${appointmentDate.getFullYear()}, ` : ' '
                    } catch {
                      return ' '
                    }
                  })()} 
                  Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '').split(' ')[0]} has established a comprehensive judicial record that provides valuable insights for legal professionals and citizens researching court proceedings.
                </p>
                
                {judge.bio && (
                  <p className="mb-4">{judge.bio}</p>
                )}
                
                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  Court Experience and Judicial Analytics for Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '').split(' ')[0]}
                </h3>
                <p className="mb-4">
                  Our comprehensive judicial analytics platform provides detailed insights into Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '').split(' ')[0]}'s case outcomes, ruling patterns, and judicial decisions. 
                  Legal professionals, attorneys, and citizens can access essential information for case strategy, legal research, and understanding judicial tendencies within the {safeJurisdiction} court system.
                </p>
                
                <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                  Find Qualified Attorneys with Experience Before Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')}
                </h3>
                <p>
                  Our attorney directory connects you with qualified legal professionals who have appeared before Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')} at {safeCourtName}. 
                  Whether you need representation for civil litigation, criminal defense, family law, or other legal matters, our directory helps you find attorneys with relevant court experience and knowledge of local judicial practices.
                </p>
              </div>
            </div>

            <JudgeProfile judge={judge} />
            <AnalyticsSliders judgeId={judge.id} judgeName={safeName} />
            <RecentDecisions judgeId={judge.id} />
            
            {/* Additional SEO Content */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Research and Legal Intelligence for Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')} Cases
              </h2>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="mb-4">
                  Understanding judicial patterns and case outcomes is essential for effective legal strategy. Our platform provides comprehensive research tools for analyzing Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')}'s judicial decisions, including:
                </p>
                <ul className="list-disc list-inside mb-4 space-y-2">
                  <li>Historical case outcome analysis and ruling patterns</li>
                  <li>Sentencing trends and judicial decision-making insights</li>
                  <li>Professional background and educational credentials</li>
                  <li>Attorney directory with court-specific experience</li>
                  <li>Legal research tools for case preparation and strategy</li>
                </ul>
                <p>
                  This judicial intelligence helps attorneys, legal professionals, and citizens make informed decisions when appearing before Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')} in {safeJurisdiction}.
                </p>
              </div>
            </div>
            
          </div>

          {/* Right Column - Attorney Directory and FAQ */}
          <div className="space-y-8">
            {/* Advertisement Section with 3 slots */}
            <div className="space-y-4">
              <LazyGoogleAd 
                slot="2345678901"
                format="rectangle"
                className="bg-gray-50 rounded-lg"
                style={{ minHeight: '250px' }}
              />
              <LazyGoogleAd 
                slot="2345678901"
                format="rectangle"
                className="bg-gray-50 rounded-lg"
                style={{ minHeight: '250px' }}
              />
              <LazyGoogleAd 
                slot="2345678901"
                format="rectangle"
                className="bg-gray-50 rounded-lg"
                style={{ minHeight: '250px' }}
              />
            </div>
            
            {/* Voice Search Optimized FAQ Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Frequently Asked Questions About Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')}
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Who is Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')}?
                  </h3>
                  <p className="text-gray-700">
                    Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')} is a Superior Court Judge serving {safeCourtName} in {safeJurisdiction}, California, with comprehensive judicial analytics and case outcome data available for legal research.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    What court does Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')} serve?
                  </h3>
                  <p className="text-gray-700">
                    Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')} presides at {safeCourtName} in {safeJurisdiction}, handling various civil, criminal, and family law matters.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    How can I research Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')}'s ruling patterns?
                  </h3>
                  <p className="text-gray-700">
                    Access comprehensive judicial analytics including ruling patterns, case outcomes, and decision trends through our professional legal research platform designed for attorneys and legal professionals.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Where can I find attorneys with experience before Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')}?
                  </h3>
                  <p className="text-gray-700">
                    Our attorney directory below connects you with qualified legal professionals who have appeared before Judge {safeName.replace(/^(judge|justice|the honorable)\s+/i, '')} and understand the local court procedures and judicial preferences.
                  </p>
                </div>
              </div>
            </div>
            
            <div id="attorney-slots">
              <AttorneySlots judgeId={judge.id} judgeName={safeName} />
            </div>
            
            {/* Related Judges for Internal Linking */}
            <RelatedJudges 
              currentJudgeId={judge.id}
              courtName={safeCourtName}
              jurisdiction={safeJurisdiction}
              judgeName={safeName}
            />
            
            <JudgeFAQ judgeName={safeName} />
          </div>
        </div>
      </div>
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
  params: { slug: string }
}

export async function generateMetadata({ params }: MetadataProps) {
  // Validate params
  if (!params.slug || typeof params.slug !== 'string') {
    return {
      title: 'Invalid Request | JudgeFinder',
      description: 'The requested page is invalid. Please check the URL and try again.',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const judge = await getJudge(params.slug)
  
  if (!judge) {
    return {
      title: 'Judge Not Found | JudgeFinder',
      description: 'The requested judge profile could not be found. Search our database of 1,810+ California judges.',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  // Additional safety checks for metadata generation
  const safeName = judge.name || 'Unknown Judge'
  const safeCourtName = judge.court_name || 'Unknown Court'
  const safeJurisdiction = judge.jurisdiction || 'Unknown Jurisdiction'

  // Generate canonical slug - use the actual slug from database if available, otherwise create one
  const canonicalSlug = judge.slug || createCanonicalSlug(safeName)
  
  // Extract court type and location for advanced SEO targeting
  const courtType = safeCourtName.includes('Superior') ? 'Superior Court' : 
                   safeCourtName.includes('Appeal') ? 'Court of Appeal' :
                   safeCourtName.includes('Supreme') ? 'Supreme Court' :
                   safeCourtName.includes('Federal') ? 'Federal Court' : 'Court'

  // Calculate years of service for compelling meta descriptions
  let yearsExperience = ''
  let serviceYears = 0
  if (judge.appointed_date) {
    try {
      serviceYears = new Date().getFullYear() - new Date(judge.appointed_date).getFullYear()
      yearsExperience = serviceYears > 0 ? ` with ${serviceYears}+ years judicial experience` : ''
    } catch (dateError) {
      console.warn('Invalid appointed_date format:', judge.appointed_date)
    }
  }

  // Extract name variations for comprehensive keyword targeting
  const nameWithoutTitle = safeName.replace(/^(judge|justice|the honorable)\s+/i, '').trim()
  const nameParts = nameWithoutTitle.split(' ').filter(part => part.length > 1)
  const firstName = nameParts[0] || ''
  const lastName = nameParts[nameParts.length - 1] || ''
  const fullNameNoMiddle = nameParts.length > 2 ? `${firstName} ${lastName}` : nameWithoutTitle

  // Generate high-CTR optimized title with compelling format
  const optimizedTitle = serviceYears >= 10 
    ? `${nameWithoutTitle} | Veteran ${safeJurisdiction} ${courtType} Judge | Official Profile & Analytics`
    : `Judge ${nameWithoutTitle} | ${safeJurisdiction} ${courtType} | Complete Profile & Judicial Analytics`

  // Create compelling, action-oriented meta description for maximum CTR
  const compelling_description = serviceYears >= 10
    ? `Get complete profile for veteran Judge ${nameWithoutTitle} serving ${safeCourtName}${yearsExperience}. View ruling patterns, case outcomes, professional background & find qualified attorneys with court experience. Essential legal intelligence for attorneys and citizens.`
    : `Research Judge ${nameWithoutTitle} serving ${safeCourtName} in ${safeJurisdiction}${yearsExperience}. Access judicial analytics, ruling patterns, case outcomes & connect with experienced attorneys. Complete legal intelligence for case strategy and court research.`

  // Comprehensive keyword strategy for search dominance
  const comprehensiveKeywords = [
    // Primary name variations
    nameWithoutTitle,
    `Judge ${nameWithoutTitle}`,
    `The Honorable ${nameWithoutTitle}`,
    fullNameNoMiddle !== nameWithoutTitle ? fullNameNoMiddle : null,
    fullNameNoMiddle !== nameWithoutTitle ? `Judge ${fullNameNoMiddle}` : null,
    
    // Court and location targeting
    `${nameWithoutTitle} ${safeCourtName}`,
    `${nameWithoutTitle} ${safeJurisdiction}`,
    `${nameWithoutTitle} ${courtType}`,
    `${safeJurisdiction} ${courtType} judges`,
    `${safeCourtName} judges`,
    
    // Professional legal terms
    `${nameWithoutTitle} judicial analytics`,
    `${nameWithoutTitle} ruling patterns`,
    `${nameWithoutTitle} case outcomes`,
    `${nameWithoutTitle} sentencing patterns`,
    `${nameWithoutTitle} judicial decisions`,
    `${nameWithoutTitle} court record`,
    `${nameWithoutTitle} background`,
    `${nameWithoutTitle} biography`,
    `${nameWithoutTitle} professional profile`,
    
    // Legal professional searches
    `attorneys before Judge ${nameWithoutTitle}`,
    `lawyers ${nameWithoutTitle} court`,
    `appearing before Judge ${nameWithoutTitle}`,
    `${nameWithoutTitle} attorney directory`,
    `experienced attorneys ${safeCourtName}`,
    
    // Voice search and natural language
    `who is Judge ${nameWithoutTitle}`,
    `about Judge ${nameWithoutTitle}`,
    `Judge ${nameWithoutTitle} information`,
    `contact Judge ${nameWithoutTitle}`,
    
    // Research and strategy terms
    'judicial research',
    'legal analytics',
    'court research',
    'case strategy',
    'judicial intelligence',
    'legal intelligence',
    'judge research',
    'court analytics'
  ].filter(Boolean)

  // Base URL for all canonical references
  const baseUrl = 'https://judgefinder.io'
  const canonicalUrl = `${baseUrl}/judges/${canonicalSlug}`

  return {
    title: optimizedTitle,
    description: compelling_description,
    keywords: comprehensiveKeywords.join(', '),
    
    // Canonical and alternate URLs for SEO authority
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en-US': canonicalUrl,
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
      title: `Judge ${nameWithoutTitle} - Complete Judicial Profile & Analytics`,
      description: `Research ${nameWithoutTitle}'s judicial background, ruling patterns, and case outcomes. Find experienced attorneys and get essential legal insights for your case strategy.`,
      type: 'profile',
      url: canonicalUrl,
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
      title: `Judge ${nameWithoutTitle} - ${safeJurisdiction} ${courtType}`,
      description: `Complete judicial profile: ${nameWithoutTitle}'s analytics, ruling patterns & attorney directory. Essential legal intelligence for case strategy.`,
      images: {
        url: `${baseUrl}/twitter-judge-profile.png`,
        alt: `Judge ${nameWithoutTitle} - Judicial Profile and Legal Analytics`,
      },
    },

    // Enhanced metadata for legal authority
    authors: [{ name: 'JudgeFinder Legal Research Team', url: 'https://judgefinder.io/about' }],
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
export const revalidate = 3600