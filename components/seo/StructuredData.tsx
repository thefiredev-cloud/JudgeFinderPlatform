'use client'

import { getBaseUrl } from '@/lib/utils/baseUrl'

interface StructuredDataProps {
  type: 'website' | 'judge' | 'court' | 'organization'
  data: any
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const baseUrl = getBaseUrl()
  const getStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
    }

    switch (type) {
      case 'website':
        return {
          ...baseData,
          '@type': 'WebSite',
          name: 'JudgeFinder Platform',
          alternateName: 'JudgeFinder.io',
          url: baseUrl,
          description: 'Free judicial transparency and bias detection tool for citizens, attorneys, and litigants researching judicial patterns across California.',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${baseUrl}/search?q={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
          },
          publisher: {
            '@type': 'Organization',
            name: 'JudgeFinder Platform',
            url: baseUrl
          }
        }

      case 'organization':
        return {
          ...baseData,
          '@type': 'Organization',
          name: 'JudgeFinder Platform',
          url: baseUrl,
          description: 'Free judicial transparency and bias detection tool providing access to comprehensive California judicial data.',
          foundingDate: '2025',
          knowsAbout: [
            'Judicial transparency',
            'Legal analytics',
            'Court decisions',
            'Judge research',
            'Bias detection',
            'California courts'
          ],
          serviceArea: {
            '@type': 'State',
            name: 'California'
          },
          offers: {
            '@type': 'Service',
            name: 'Judicial Research and Transparency',
            description: 'Free access to judge and court information for transparency and bias detection'
          }
        }

      case 'judge':
        return {
          ...baseData,
          '@type': 'Person',
          '@id': `${baseUrl}/judges/${data.slug}`,
          name: data.name,
          jobTitle: 'Judge',
          worksFor: {
            '@type': 'GovernmentOrganization',
            name: data.court_name,
            '@id': `${baseUrl}/courts/${data.court_slug}`
          },
          knowsAbout: data.specialties || [],
          url: `${baseUrl}/judges/${data.slug}`,
          sameAs: data.external_links || []
        }

      case 'court':
        return {
          ...baseData,
          '@type': 'GovernmentOrganization',
          '@id': `${baseUrl}/courts/${data.slug}`,
          name: data.name,
          description: `${data.type} serving ${data.jurisdiction} jurisdiction`,
          url: `${baseUrl}/courts/${data.slug}`,
          address: {
            '@type': 'PostalAddress',
            addressRegion: data.jurisdiction
          },
          areaServed: {
            '@type': 'State',
            name: 'California'
          },
          employee: data.judges?.map((judge: any) => ({
            '@type': 'Person',
            name: judge.name,
            jobTitle: 'Judge',
            url: `${baseUrl}/judges/${judge.slug}`
          })) || []
        }

      default:
        return baseData
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getStructuredData(), null, 2)
      }}
    />
  )
}
