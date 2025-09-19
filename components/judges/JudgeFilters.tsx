'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Filter, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/index'
import {
  getDefaultJudgeFilters,
  JUDGE_FILTER_DEFAULTS,
  JUDGE_FILTER_LABELS,
  JUDGE_FILTER_VALUES,
  JudgeFilterKey,
  JudgeFilterState,
} from './filterConfig'

const selectClass =
  'rounded-lg border border-border/60 bg-[hsl(var(--bg-2))] px-3 py-2 text-sm text-[color:hsl(var(--text-1))] focus:border-[rgba(110,168,254,0.45)] focus:outline-none focus:ring-0'

interface JudgeFiltersProps {
  value: JudgeFilterState
  onChange: (next: JudgeFilterState) => void
  onReset?: () => void
}

export function JudgeFilters({ value, onChange, onReset }: JudgeFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const pills = useMemo(
    () =>
      (Object.entries(JUDGE_FILTER_LABELS) as Array<[JudgeFilterKey, string]>).map(([key, label]) => {
        const rawValue = value[key] ?? JUDGE_FILTER_DEFAULTS[key]
        const displayValue = JUDGE_FILTER_VALUES[key][rawValue] ?? rawValue
        const baseValue = JUDGE_FILTER_DEFAULTS[key]
        const isActive = rawValue !== baseValue
        return { key, label, rawValue, displayValue, isActive }
      }),
    [value],
  )

  const handleReset = () => {
    if (onReset) {
      onReset()
    } else {
      onChange(getDefaultJudgeFilters())
    }
  }

  const handleSelectChange = (key: JudgeFilterKey, nextValue: string) => {
    onChange({ ...value, [key]: nextValue })
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-2.5 py-1.5">
        <Filter className="h-4 w-4 text-[color:hsl(var(--text-3))]" aria-hidden />
        {pills.map(({ key, label, displayValue, isActive }) => (
          <button
            key={key}
            type="button"
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              isActive
                ? 'bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--text-1))]'
                : 'text-[color:hsl(var(--text-2))] hover:text-[color:hsl(var(--text-1))]',
            )}
            onClick={() => setSheetOpen(true)}
            aria-label={`${label} filter: ${displayValue}`}
          >
            <span>{label}</span>
            <span className="text-[color:hsl(var(--text-3))]">·</span>
            <span>{displayValue}</span>
            <ChevronDown className="h-3 w-3" aria-hidden />
          </button>
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-2 rounded-full border border-border/60 bg-[hsl(var(--bg-1))] px-3 text-[color:hsl(var(--text-2))] hover:text-[color:hsl(var(--text-1))]"
        onClick={() => setSheetOpen(true)}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        More filters
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-full px-3 text-[color:hsl(var(--text-2))] hover:text-[color:hsl(var(--text-1))]"
        onClick={handleReset}
      >
        Reset
      </Button>

      {sheetOpen && (
        <div
          className="safe-area-pb fixed inset-0 z-40 flex items-end justify-center bg-black/60 px-4 sm:items-center"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSheetOpen(false)
            }
          }}
        >
          <div className="relative w-full max-w-xl rounded-2xl border border-border bg-[hsl(var(--bg-1))] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[color:hsl(var(--text-1))]">Advanced filters</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="rounded-full border border-border/60 p-1 text-[color:hsl(var(--text-2))] transition-colors hover:text-[color:hsl(var(--text-1))]"
                aria-label="Close advanced filters"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="mt-2 text-sm text-[color:hsl(var(--text-3))]">
              Configure date ranges, motion types, party roles, and saved views. Additional filters are coming online
              during Phase 3.
            </p>

            <div className="mt-6 space-y-4 text-sm text-[color:hsl(var(--text-2))]">
              {(Object.entries(JUDGE_FILTER_LABELS) as Array<[JudgeFilterKey, string]>).map(([key, label]) => (
                <label key={key} className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-[color:hsl(var(--text-3))]">{label}</span>
                  <select
                    value={value[key] ?? JUDGE_FILTER_DEFAULTS[key]}
                    onChange={(event) => handleSelectChange(key, event.target.value)}
                    className={selectClass}
                  >
                    {Object.entries(JUDGE_FILTER_VALUES[key]).map(([filterValue, display]) => (
                      <option key={filterValue} value={filterValue}>
                        {display}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                size="sm"
                className="rounded-full px-4"
                onClick={() => setSheetOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full px-4 text-[color:hsl(var(--text-2))] hover:text-[color:hsl(var(--text-1))]"
                onClick={handleReset}
              >
                Reset filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { getDefaultJudgeFilters } from './filterConfig'
