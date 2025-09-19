import { Building2, CalendarDays, Clock, Sparkles, Users } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils/index'
import type { Judge } from '@/types'

interface JudgeHeaderProps {
  judge: Judge
  appointmentYear: number | null
  yearsOfService: number | null
  dataFreshnessLabel: string
  className?: string
}

const FALLBACK_AVATAR_COLORS = [
  'bg-[rgba(110,168,254,0.15)] text-[rgba(110,168,254,0.9)]',
  'bg-[rgba(103,232,169,0.12)] text-[rgba(103,232,169,0.88)]',
  'bg-[rgba(124,135,152,0.15)] text-[rgba(180,187,198,0.9)]',
]

function getInitials(name: string): string {
  if (!name) return 'JF'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase()
}

export function JudgeHeader({
  judge,
  appointmentYear,
  yearsOfService,
  dataFreshnessLabel,
  className,
}: JudgeHeaderProps) {
  const avatarInitials = getInitials(judge.name)
  const fallbackPalette = FALLBACK_AVATAR_COLORS[judge.name.length % FALLBACK_AVATAR_COLORS.length] ?? FALLBACK_AVATAR_COLORS[0]

  return (
    <header
      className={cn(
        'w-full rounded-2xl border border-border/70 bg-[hsl(var(--bg-2))] px-6 py-5 shadow-[0_1px_0_rgba(38,43,54,0.45)] backdrop-blur-sm md:px-8 md:py-6',
        className,
      )}
    >
      <div className="flex flex-col gap-6 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <div className="flex flex-1 items-start gap-4">
          <div
            className={cn(
              'flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border/60 text-xl font-semibold uppercase shadow-[0_0_0_1px_rgba(38,43,54,0.55)]',
              fallbackPalette,
            )}
            aria-hidden
          >
            {judge.profile_image_url ? (
              <Image
                src={judge.profile_image_url}
                alt={judge.name}
                width={64}
                height={64}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              avatarInitials
            )}
          </div>
          <div className="space-y-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:hsl(var(--text-3))]">
                <Sparkles className="h-3 w-3" aria-hidden />
                Judge Analytics Overview
              </div>
              <h1 className="mt-1 break-words text-[1.75rem] font-semibold leading-tight text-[color:hsl(var(--text-1))] md:text-[2.125rem]">
                {judge.name}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[color:hsl(var(--text-2))]">
              {judge.court_name && (
                <span className="inline-flex items-center gap-1.5 break-words">
                  <Building2 className="h-4 w-4" aria-hidden />
                  {judge.court_name}
                </span>
              )}
              {judge.jurisdiction && (
                <span className="inline-flex items-center gap-1.5 break-words">
                  <Users className="h-4 w-4" aria-hidden />
                  {judge.jurisdiction}
                </span>
              )}
              {appointmentYear && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  Appointed {appointmentYear}
                </span>
              )}
              {yearsOfService !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" aria-hidden />
                  {yearsOfService} years on bench
                </span>
              )}
            </div>
            <p className="max-w-prose text-sm leading-snug text-[color:hsl(var(--text-3))]">
              AI-assisted analysis of historical rulings; not a prediction of outcome.
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col items-start gap-3 md:w-auto md:items-end">
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-[color:hsl(var(--text-3))]">Data freshness</div>
          <div className="max-w-xs text-sm text-[color:hsl(var(--text-2))] break-words text-left md:text-right">
            {dataFreshnessLabel}
          </div>
        </div>
      </div>
    </header>
  )
}
