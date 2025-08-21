import { EnhancedJudgeSearch } from '@/components/judges/EnhancedJudgeSearch'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Advanced Judge Search - JudgeFinder.io',
  description: 'Find the perfect judge for your case using advanced filters including case types, experience, settlement rates, efficiency scores, and specializations.',
  keywords: [
    'advanced judge search',
    'judge filtering',
    'case type search',
    'judge experience',
    'settlement rates',
    'judicial analytics',
    'legal research'
  ].join(', '),
  openGraph: {
    title: 'Advanced Judge Search - JudgeFinder.io',
    description: 'Advanced judge search with comprehensive filtering options for legal professionals',
    type: 'website'
  }
}

export default function AdvancedSearchPage() {
  return <EnhancedJudgeSearch />
}