import { Metadata } from 'next'
import HomePageClient from '@/components/home/HomePageClient'
import { HomepageFAQ } from '@/components/seo/HomepageFAQ'
import { getBaseUrl } from '@/lib/utils/baseUrl'

const BASE_URL = getBaseUrl()

// Server-side metadata generation for SEO
export const metadata: Metadata = {
  title: 'JudgeFinder.io - California Judicial Transparency Platform | Free Legal Research',
  description: 'Research California judges instantly with AI-powered analytics, bias detection, ruling patterns, and case outcomes. Free access to comprehensive court data for attorneys, litigants, and citizens.',
  keywords: 'california judges, find my judge, court appearance preparation, judicial analytics, judge bias detection, california courts, legal research, judge profiles, court analytics, judicial transparency, california superior court judges, judge ruling patterns, legal intelligence, court preparation, judge information, california judicial directory, court case research, judge decision history, legal transparency platform, free judge lookup',
  
  openGraph: {
    title: 'JudgeFinder.io - California Judicial Analytics Platform',
    description: 'Instant access to California judge profiles with AI-powered analytics. Research ruling patterns, bias indicators, and case outcomes. 100% free for attorneys and citizens.',
    type: 'website',
    url: BASE_URL,
    siteName: 'JudgeFinder.io',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'JudgeFinder - California Judicial Analytics Platform',
      }
    ],
    locale: 'en_US',
  },
  
  twitter: {
    card: 'summary_large_image',
    title: 'Find Your California Judge - Free Judicial Analytics',
    description: 'Research California judges with AI-powered analytics. Ruling patterns, bias detection, case outcomes. 100% free access.',
    images: ['/twitter-image'],
    creator: '@judgefinder',
    site: '@judgefinder',
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
    canonical: BASE_URL,
  },
  
  other: {
    'google-site-verification': 'your-google-verification-code',
    'msvalidate.01': 'your-bing-verification-code',
    'yandex-verification': 'your-yandex-verification-code',
    'fb:app_id': 'your-facebook-app-id',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no',
  },
}

// Generate comprehensive structured data for homepage
function generateHomepageStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: BASE_URL,
        name: 'JudgeFinder.io',
        description: 'California\'s judicial analytics and transparency platform',
        publisher: {
          '@id': `${BASE_URL}/#organization`
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${BASE_URL}/judges?q={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        },
        inLanguage: 'en-US'
      },
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'JudgeFinder',
        url: BASE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/logo.png`,
          width: 600,
          height: 60
        },
        description: 'Leading platform for judicial transparency and legal analytics in California',
        sameAs: [
          'https://twitter.com/judgefinder',
          'https://linkedin.com/company/judgefinder',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'support@judgefinder.io',
          availableLanguage: 'English'
        }
      },
      {
        '@type': 'WebApplication',
        name: 'JudgeFinder Legal Research Platform',
        url: BASE_URL,
        applicationCategory: 'Legal Research',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free access to judicial analytics and court data'
        },
        featureList: [
          'Comprehensive California Judge Profiles',
          'AI-Powered Bias Detection',
          'Real-time Case Analytics',
          'Extensive Court Decision Library',
          'Ruling Pattern Analysis',
          'Free Anonymous Access'
        ]
      },
      {
        '@type': 'Service',
        name: 'Judicial Analytics Service',
        provider: {
          '@id': `${BASE_URL}/#organization`
        },
        serviceType: 'Legal Research and Analytics',
        areaServed: {
          '@type': 'State',
          name: 'California',
          containedInPlace: {
            '@type': 'Country',
            name: 'United States'
          }
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Legal Research Services',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Judge Profile Research',
                description: 'Comprehensive judicial profiles with analytics'
              }
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Bias Detection Analysis',
                description: 'AI-powered judicial bias pattern detection'
              }
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Case Outcome Analytics',
                description: 'Historical case outcome analysis and patterns'
              }
            }
          ]
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${BASE_URL}/#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: BASE_URL
          }
        ]
      }
    ]
  }
}

export default function HomePage() {
  return (
    <>
      {/* Comprehensive Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateHomepageStructuredData())
        }}
      />
      
      {/* Main Homepage Content */}
      <HomePageClient />
      
      {/* FAQ Section with Schema Markup */}
      <HomepageFAQ />
    </>
  )
}
