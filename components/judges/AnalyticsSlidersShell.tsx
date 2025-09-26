'use client'

import { lazy, Suspense } from 'react'

const LazyAnalyticsSliders = lazy(() => import('@/components/judges/AnalyticsSliders'))

interface AnalyticsSlidersShellProps {
  judgeId: string
  judgeName: string
}

export function AnalyticsSlidersShell({ judgeId, judgeName }: AnalyticsSlidersShellProps) {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading AI analytics…
        </div>
      }
    >
      <LazyAnalyticsSliders judgeId={judgeId} judgeName={judgeName} />
    </Suspense>
  )
}

