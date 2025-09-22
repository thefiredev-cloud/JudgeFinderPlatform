import { Suspense } from 'react'
import type { Metadata } from 'next'
import JudgesContent from './JudgesContent'
import { JudgeCardSkeleton, SearchSkeleton } from '@/components/ui/Skeleton'
import { ParticleBackground } from '@/components/ui/ParticleBackground'
import { TypewriterText } from '@/components/ui/TypewriterText'
import { ScrollIndicator } from '@/components/ui/ScrollIndicator'
import { getBaseUrl } from '@/lib/utils/baseUrl'

const BASE_URL = getBaseUrl()

export const metadata: Metadata = {
  title: 'California Judges Directory | JudgeFinder',
  description: 'Search California judges with comprehensive profiles, judicial analytics, and comparison tools. Filter by court, jurisdiction, experience, and bias indicators.',
  alternates: {
    canonical: `${BASE_URL}/judges`,
  },
  openGraph: {
    title: 'California Judges Directory | JudgeFinder',
    description: 'Explore detailed judge profiles, court assignments, and AI-powered analytics for California courts.',
    url: `${BASE_URL}/judges`,
    type: 'website',
    siteName: 'JudgeFinder',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'California Judges Directory | JudgeFinder',
    description: 'Find judicial profiles, analytics, and comparison tools for California courts.',
  },
}

// Loading fallback component for Suspense
function JudgesLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Enhanced Hero Section with Animations */}
      <section className="relative min-h-[60vh] flex items-center justify-center">
        <ParticleBackground particleCount={30} />
        
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-enterprise-primary/10 via-enterprise-deep/10 to-background" />
        
        <div className="relative z-10 text-center px-4 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="mb-6 text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-enterprise-primary to-enterprise-deep bg-clip-text text-transparent">
                California Judges
              </span>
              <br />
              <span className="text-foreground">
                <TypewriterText text="Directory" />
              </span>
            </h1>
          </div>
          
          <p className="mx-auto mb-12 max-w-2xl text-lg md:text-xl text-muted-foreground">
            Loading judicial profiles and analytics...
          </p>
        </div>
        
        <ScrollIndicator />
      </section>

      {/* Search and Filters Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchSkeleton />
      </div>

      {/* Judges Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index}>
              <JudgeCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

async function getInitialJudges() {
  try {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/api/judges/list?limit=20&page=1&jurisdiction=CA&include_decisions=true`, {
      cache: 'force-cache',
      next: { revalidate: 600 }
    })
    if (!response.ok) return null
    const data = await response.json()
    return data
  } catch {
    return null
  }
}

export default async function JudgesPage() {
  const initialData = await getInitialJudges()
  return (
    <Suspense fallback={<JudgesLoading />}>
      <JudgesContent initialData={initialData || undefined} />
    </Suspense>
  )
}
