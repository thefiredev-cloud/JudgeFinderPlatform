"use client"

import Link from 'next/link'
import { useMemo } from 'react'
import { GraduationCap, MapPin } from 'lucide-react'
import { BookmarkButton } from './BookmarkButton'
import { JudgeFilters } from './JudgeFilters'
import { JudgeHeader } from './JudgeHeader'
import type { Judge } from '@/types'
import { useJudgeFilters } from '@/hooks/useJudgeFilters'

interface JudgeProfileProps {
  judge: Judge
}

function formatDataFreshness(updatedAt: string): string {
  if (!updatedAt) return 'Data freshness unavailable'
  const updated = new Date(updatedAt)
  if (Number.isNaN(updated.getTime())) return 'Data freshness unavailable'

  return `Updated ${updated.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`
}

function buildEducationSummary(judge: Judge): string | null {
  const courtlistenerData = judge.courtlistener_data
  if (courtlistenerData?.educations?.length) {
    const summary = courtlistenerData.educations
      .map((edu: any) => {
        const school = edu.school?.name || edu.school_name || ''
        const degree = edu.degree || ''
        return [school, degree].filter(Boolean).join(' — ')
      })
      .filter(Boolean)[0]

    if (summary) return summary
  }

  return judge.education
}

export function JudgeProfile({ judge }: JudgeProfileProps) {
  const courtlistenerData = judge.courtlistener_data

  let appointmentDate: Date | null = null
  let yearsOfService: number | null = null

  if (judge.appointed_date) {
    appointmentDate = new Date(judge.appointed_date)
  } else if (courtlistenerData?.positions?.length) {
    const judicialPositions = courtlistenerData.positions
      .filter((pos: any) => pos.position_type && ['jud', 'c-jud', 'jus', 'c-jus'].includes(pos.position_type))
      .sort((a: any, b: any) => (a.date_start || '').localeCompare(b.date_start || ''))

    if (judicialPositions.length > 0 && judicialPositions[0].date_start) {
      appointmentDate = new Date(judicialPositions[0].date_start)
    }
  }

  if (appointmentDate && !Number.isNaN(appointmentDate.getTime())) {
    const now = new Date()
    yearsOfService = Math.max(0, now.getFullYear() - appointmentDate.getFullYear())
  }

  const educationSummary = buildEducationSummary(judge)
  const dataFreshnessLabel = formatDataFreshness(judge.updated_at)

  const { filters, setFilters, resetFilters } = useJudgeFilters()

  const sectionLinks = useMemo(
    () => [
      { href: '#overview', label: 'Overview' },
      { href: '#coverage', label: 'Methodology' },
      { href: '#professional-background', label: 'Background' },
      { href: '#analytics', label: 'Analytics' },
      { href: '#recent-decisions', label: 'Recent decisions' },
    ],
    [],
  )

  const metricTiles = [
    {
      label: 'Total rulings parsed',
      value: judge.total_cases > 0 ? judge.total_cases.toLocaleString() : '—',
      helper: 'Across all available case types',
      dataType: 'record' as const,
    },
    {
      label: 'Reversal rate',
      value: judge.reversal_rate > 0 ? `${(judge.reversal_rate * 100).toFixed(1)}%` : '—',
      helper: 'Share of reviewed decisions reversed on appeal',
      dataType: 'record' as const,
    },
    {
      label: 'Average days to decision',
      value:
        judge.average_decision_time !== null && judge.average_decision_time > 0
          ? `${judge.average_decision_time}`
          : '—',
      helper: 'Median elapsed time from filing to decision',
      dataType: 'record' as const,
    },
    {
      label: 'Education highlight',
      value: educationSummary || 'Pending data enrichment',
      helper: 'Sourced from CourtListener public records',
      dataType: 'record' as const,
    },
  ]

  return (
    <section className="space-y-6">
      <JudgeHeader
        judge={judge}
        appointmentYear={appointmentDate ? appointmentDate.getFullYear() : null}
        yearsOfService={yearsOfService}
        dataFreshnessLabel={dataFreshnessLabel}
      />

      <div className="sticky top-24 z-30 space-y-3 rounded-2xl border border-border/60 bg-[hsl(var(--bg-2))] px-5 py-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--bg-2))/0.85]">
        <nav className="flex flex-wrap items-center gap-2" aria-label="Judge analytics sections">
          {sectionLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center rounded-full border border-transparent bg-[hsl(var(--bg-1))] px-3 py-1.5 text-xs font-medium text-[color:hsl(var(--text-2))] transition-colors hover:border-[rgba(110,168,254,0.45)] hover:text-[color:hsl(var(--text-1))]"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <JudgeFilters value={filters} onChange={setFilters} onReset={resetFilters} />
          <BookmarkButton judgeId={judge.id} judgeName={judge.name} className="hidden md:inline-flex" />
        </div>
      </div>
      <div className="md:hidden">
        <BookmarkButton
          judgeId={judge.id}
          judgeName={judge.name}
          className="mt-1 w-full justify-center"
        />
      </div>

      <div id="overview" className="grid gap-4 scroll-mt-32 md:grid-cols-2 xl:grid-cols-4">
        {metricTiles.map((tile) => {
          const dataBadge = tile.dataType === 'record' ? 'Court record' : 'AI estimate'
          const longValue = typeof tile.value === 'string' && tile.value.length > 18
          const valueClass = longValue
            ? 'mt-3 text-lg font-semibold text-[color:hsl(var(--text-1))] leading-relaxed break-words'
            : 'mt-3 text-3xl font-semibold leading-none text-[color:hsl(var(--text-1))] break-words'

          return (
            <article
              key={tile.label}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-[hsl(var(--bg-2))] p-5 transition-colors duration-300 hover:border-[rgba(110,168,254,0.45)]"
            >
              <div className="text-xs uppercase tracking-[0.24em] text-[color:hsl(var(--text-3))]">
                {tile.label}
              </div>
              <div className={valueClass}>
                {tile.value}
              </div>
              <div className="mt-3 h-[38px] w-full rounded-full bg-[rgba(124,135,152,0.14)]">
                <div className="h-full w-1/2 rounded-full bg-[rgba(110,168,254,0.22)] transition-all duration-500 group-hover:w-[62%]" />
              </div>
              <div className="mt-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:hsl(var(--text-3))]">
                <span className="rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-2 py-1 text-[color:hsl(var(--text-2))]">
                  {dataBadge}
                </span>
              </div>
              <p className="mt-3 text-xs text-[color:hsl(var(--text-3))] leading-relaxed">{tile.helper}</p>
            </article>
          )
        })}
      </div>

      <aside
        id="coverage"
        className="scroll-mt-32 rounded-2xl border border-border/60 bg-[hsl(var(--bg-2))] p-5 text-sm text-[color:hsl(var(--text-2))]"
      >
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em] text-[color:hsl(var(--text-3))]">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          Coverage and methodology
        </div>
        <p className="mt-3 leading-6 text-[color:hsl(var(--text-2))]">
          Analytics include rulings captured from CourtListener, state registers, and verified public sources.
          Data coverage expands nightly with automated syncs; key slices (motions, appeals, parties) are staged
          below for deeper review.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[color:hsl(var(--text-3))]">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-3 py-1 font-semibold uppercase tracking-[0.2em]">
            Court record
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-3 py-1 font-semibold uppercase tracking-[0.2em] text-[color:hsl(var(--accent))]">
            AI estimate
          </span>
          <Link
            href="/docs/methodology"
            className="inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1.5 font-medium text-[color:hsl(var(--accent))] transition-colors hover:border-[rgba(110,168,254,0.5)] hover:text-[color:hsl(var(--text-1))]"
          >
            Methodology &amp; limitations
          </Link>
        </div>
        {educationSummary && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/50 bg-[hsl(var(--bg-1))] px-4 py-2 text-xs text-[color:hsl(var(--text-2))]">
            <GraduationCap className="h-4 w-4" aria-hidden />
            {educationSummary}
          </p>
        )}
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-4 py-2 text-xs font-semibold text-[color:hsl(var(--text-2))] transition-colors hover:border-[rgba(110,168,254,0.45)] hover:text-[color:hsl(var(--text-1))]"
          onClick={() => {
            document.dispatchEvent(new CustomEvent('open-report-profile-issue'))
          }}
        >
          Report data issue
        </button>
      </aside>
    </section>
  )
}
