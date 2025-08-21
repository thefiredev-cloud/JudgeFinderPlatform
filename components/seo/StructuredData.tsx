'use client'

interface StructuredDataProps {
  type: 'website' | 'judge' | 'court' | 'organization'
  data: any
}

export function StructuredData({ type, data }: StructuredDataProps) {
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
          url: 'https://judgefinder.io',
          description: 'Free judicial transparency and bias detection tool for citizens, attorneys, and litigants researching judicial patterns across California.',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://judgefinder.io/search?q={search_term_string}'
            },
            'query-input': 'required name=search_term_string'
          },
          publisher: {
            '@type': 'Organization',
            name: 'JudgeFinder Platform',
            url: 'https://judgefinder.io'
          }
        }

      case 'organization':
        return {
          ...baseData,
          '@type': 'Organization',
          name: 'JudgeFinder Platform',
          url: 'https://judgefinder.io',
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
          '@id': `https://judgefinder.io/judges/${data.slug}`,
          name: data.name,
          jobTitle: 'Judge',
          worksFor: {
            '@type': 'GovernmentOrganization',
            name: data.court_name,
            '@id': `https://judgefinder.io/courts/${data.court_slug}`
          },
          knowsAbout: data.specialties || [],
          url: `https://judgefinder.io/judges/${data.slug}`,
          sameAs: data.external_links || []
        }

      case 'court':
        return {
          ...baseData,
          '@type': 'GovernmentOrganization',
          '@id': `https://judgefinder.io/courts/${data.slug}`,
          name: data.name,
          description: `${data.type} serving ${data.jurisdiction} jurisdiction`,
          url: `https://judgefinder.io/courts/${data.slug}`,
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
            url: `https://judgefinder.io/judges/${judge.slug}`
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