'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const LazySearchSection = dynamic(() => import('@/components/home/sections/SearchSection').then(mod => mod.SearchSection), {
  loading: () => null,
})
const LazyBenefitsSection = dynamic(() => import('@/components/home/sections/BenefitsSection').then(mod => mod.BenefitsSection), {
  loading: () => null,
  ssr: false,
})
const LazyCallToAction = dynamic(() => import('@/components/home/sections/CallToActionSection').then(mod => mod.CallToActionSection), {
  loading: () => null,
})

const LazyLiveInsights = dynamic(() => import('@/components/home/sections/LiveInsightsSection').then(mod => mod.LiveInsightsSection), {
  loading: () => null,
  ssr: false,
})

export default function HomeEnhancements(): JSX.Element {
  return (
    <div className="overflow-hidden">
      <Suspense fallback={null}>
        <LazySearchSection />
      </Suspense>
      <Suspense fallback={null}>
        <LazyBenefitsSection />
      </Suspense>
      <Suspense fallback={null}>
        <LazyLiveInsights />
      </Suspense>
      <Suspense fallback={null}>
        <LazyCallToAction />
      </Suspense>
    </div>
  )
}
