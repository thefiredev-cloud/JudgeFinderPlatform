import type { Metadata } from 'next'
import JurisdictionsPage from './ClientPage'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://judgefinder.io').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Jurisdictions & Counties | JudgeFinder',
  description: 'Browse California jurisdictions and counties to find court locations, judge rosters, and legal analytics tailored to each region.',
  alternates: {
    canonical: `${APP_URL}/jurisdictions`,
  },
  openGraph: {
    title: 'Jurisdictions & Counties | JudgeFinder',
    description: 'Explore county-specific courts, judges, and legal resources across California.',
    url: `${APP_URL}/jurisdictions`,
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
