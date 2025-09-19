'use client'

import { cn } from '@/lib/utils'
import { QualityBadge, type QualityLevel } from '@/components/judges/QualityBadge'

interface MetricProvenanceProps {
  source: string
  lastUpdated?: string | null
  n?: number | null
  quality: QualityLevel
  className?: string
}

function formatDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function MetricProvenance({ source, lastUpdated, n, quality, className }: MetricProvenanceProps) {
  const formattedDate = formatDate(lastUpdated)
  const countLabel = typeof n === 'number' && n >= 0 ? `${n.toLocaleString()} cases` : 'Sample size unavailable'

  return (
    <div
      className={cn(
        'mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-[hsl(var(--bg-1))] px-4 py-3 text-xs text-muted-foreground',
        className,
      )}
    >
      <QualityBadge level={quality} />
      <span className="inline-flex items-center gap-1">
        <span className="font-semibold text-foreground">{countLabel}</span>
      </span>
      <span className="hidden h-4 w-px bg-border sm:inline-block" aria-hidden />
      <span className="inline-flex items-center gap-1 capitalize">
        <span className="font-semibold text-foreground">Source:</span>
        <span>{source}</span>
      </span>
      {formattedDate && (
        <>
          <span className="hidden h-4 w-px bg-border sm:inline-block" aria-hidden />
          <span className="inline-flex items-center gap-1">
            <span className="font-semibold text-foreground">Updated:</span>
            <span>{formattedDate}</span>
          </span>
        </>
      )}
    </div>
  )
}
