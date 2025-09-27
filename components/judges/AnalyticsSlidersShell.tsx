'use client'

import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import GlassCard from '@/components/ui/GlassCard'

const LazyAnalyticsSliders = lazy(() => import('@/components/judges/AnalyticsSliders'))

interface AnalyticsSlidersShellProps {
  judgeId: string
  judgeName: string
}

export function AnalyticsSlidersShell({ judgeId, judgeName }: AnalyticsSlidersShellProps) {
  return (
    <Suspense
      fallback={
        <GlassCard className="p-6 text-sm text-muted-foreground">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Loading AI analytics…
          </motion.div>
        </GlassCard>
      }
    >
      <LazyAnalyticsSliders judgeId={judgeId} judgeName={judgeName} />
    </Suspense>
  )
}

