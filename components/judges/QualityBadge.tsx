'use client'

import { cn } from '@/lib/utils'
import { InfoTooltip } from '@/components/ui/InfoTooltip'

export type QualityLevel = 'LOW' | 'GOOD' | 'HIGH'

interface QualityBadgeProps {
  level: QualityLevel
  explanation?: string
  className?: string
}

const QUALITY_META: Record<QualityLevel, { label: string; description: string; badgeClass: string }> = {
  HIGH: {
    label: 'High quality',
    description: 'Large sample size, clean source documents, and agreement across primary and fallback models.',
    badgeClass:
      'border border-[rgba(103,232,169,0.35)] bg-[rgba(103,232,169,0.14)] text-[color:hsl(var(--pos))]',
  },
  GOOD: {
    label: 'Good quality',
    description: 'Meets minimum sample requirements with minor caveats flagged by reviewers.',
    badgeClass:
      'border border-[rgba(110,168,254,0.35)] bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--accent))]',
  },
  LOW: {
    label: 'Low quality',
    description: 'Insufficient sample size or conflicting data sources; analytics hidden or limited.',
    badgeClass:
      'border border-[rgba(251,211,141,0.4)] bg-[rgba(251,211,141,0.18)] text-[color:hsl(var(--warn))]',
  },
}

export function QualityBadge({ level, explanation, className }: QualityBadgeProps) {
  const meta = QUALITY_META[level]
  const description = explanation || meta.description

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', className)}>
      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1', meta.badgeClass)}>
        {meta.label}
      </span>
      <InfoTooltip
        content={<p className="text-xs text-muted-foreground">{description}</p>}
        label={`${meta.label} details`}
      />
    </span>
  )
}
