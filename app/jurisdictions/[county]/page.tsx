import type { Metadata } from 'next'
import CountyCourtsPage, { jurisdictionMap } from './ClientPage'
import { getBaseUrl } from '@/lib/utils/baseUrl'

export const dynamic = 'force-dynamic'

interface Params {
  county: string
}

type GenerateParams = { params: Promise<Params> }

export async function generateMetadata({ params }: GenerateParams): Promise<Metadata> {
  const { county } = await params
  const jurisdictionInfo = jurisdictionMap[county]
  const baseUrl = getBaseUrl()
  const canonicalUrl = `${baseUrl}/jurisdictions/${county}`

  if (!jurisdictionInfo) {
    return {
      title: 'Jurisdiction Not Found | JudgeFinder',
      description: 'Explore California courts and jurisdictions with JudgeFinder. Find judges, court details, and legal insights.',
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const title = `${jurisdictionInfo.displayName} Courts Directory | JudgeFinder`
  const description = `Research courts and judges serving ${jurisdictionInfo.displayName}. Discover court profiles, judicial analytics, and legal resources for the area.`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      siteName: 'JudgeFinder',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default function Page() {
  return <CountyCourtsPage />
}
