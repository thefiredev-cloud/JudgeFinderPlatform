import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  JUDGE_FILTER_DEFAULTS,
  JUDGE_FILTER_DEFAULT_ENTRIES,
  JudgeFilterState,
  JudgeFilterKey,
  getDefaultJudgeFilters,
} from '@/components/judges/filterConfig'

const stringifyFilters = (filters: JudgeFilterState) => JSON.stringify(filters)

const parseFiltersFromSearchParams = (paramsString: string) => {
  const parsed = getDefaultJudgeFilters()
  if (!paramsString) {
    return parsed
  }
  const source = new URLSearchParams(paramsString)
  source.forEach((value, key) => {
    if (key in parsed) {
      parsed[key as JudgeFilterKey] = value
    }
  })
  return parsed
}

export function useJudgeFilterParams() {
  const searchParams = useSearchParams()
  const paramsKey = useMemo(() => searchParams?.toString() ?? '', [searchParams])
  const filters = useMemo(() => parseFiltersFromSearchParams(paramsKey), [paramsKey])
  const filtersKey = useMemo(() => stringifyFilters(filters), [filters])
  return { filters, filtersKey }
}

export function useJudgeFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const paramsKey = useMemo(() => searchParams?.toString() ?? '', [searchParams])
  const urlFilters = useMemo(() => parseFiltersFromSearchParams(paramsKey), [paramsKey])
  const [filters, setFilters] = useState<JudgeFilterState>(urlFilters)
  const filtersKey = useMemo(() => stringifyFilters(filters), [filters])

  useEffect(() => {
    const currentKey = stringifyFilters(filters)
    const nextKey = stringifyFilters(urlFilters)
    if (currentKey !== nextKey) {
      setFilters(urlFilters)
    }
  }, [filters, urlFilters])

  const updateUrl = useCallback(
    (next: JudgeFilterState) => {
      const params = new URLSearchParams(paramsKey)
      JUDGE_FILTER_DEFAULT_ENTRIES.forEach(([key, baseline]) => {
        const nextValue = next[key]
        if (!nextValue || nextValue === baseline) {
          params.delete(key)
        } else {
          params.set(key, nextValue)
        }
      })
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [paramsKey, pathname, router],
  )

  const handleChange = useCallback(
    (next: JudgeFilterState) => {
      setFilters(next)
      updateUrl(next)
    },
    [updateUrl],
  )

  const handleReset = useCallback(() => {
    const defaults = getDefaultJudgeFilters()
    setFilters(defaults)
    updateUrl(defaults)
  }, [updateUrl])

  return { filters, setFilters: handleChange, resetFilters: handleReset, filtersKey }
}
