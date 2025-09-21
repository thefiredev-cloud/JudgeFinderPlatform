import type { Metadata } from 'next'
import JurisdictionsPage from './ClientPage'
import { getBaseUrl } from '@/lib/utils/baseUrl'

const BASE_URL = getBaseUrl()

export const metadata: Metadata = {
  title: 'Jurisdictions & Counties | JudgeFinder',
  description: 'Browse California jurisdictions and counties to find court locations, judge rosters, and legal analytics tailored to each region.',
  alternates: {
    canonical: `${BASE_URL}/jurisdictions`,
  },
  openGraph: {
    title: 'Jurisdictions & Counties | JudgeFinder',
    description: 'Explore county-specific courts, judges, and legal resources across California.',
    url: `${BASE_URL}/jurisdictions`,
    type: 'website',
    siteName: 'JudgeFinder',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jurisdictions & Counties | JudgeFinder',
    description: 'Explore county-level court data, judges, and analytics for California jurisdictions.',
  },
}

export default function Page() {
  return <JurisdictionsPage />
}
