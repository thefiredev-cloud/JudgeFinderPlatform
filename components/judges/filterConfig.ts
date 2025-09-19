export type JudgeFilterKey = 'dateRange' | 'caseType' | 'motionType' | 'party'

export type JudgeFilterState = Record<JudgeFilterKey, string>

export const JUDGE_FILTER_DEFAULTS: Readonly<Record<JudgeFilterKey, string>> = {
  dateRange: 'all-time',
  caseType: 'all',
  motionType: 'all',
  party: 'all-parties',
} as const

export const JUDGE_FILTER_LABELS: Record<JudgeFilterKey, string> = {
  dateRange: 'Date',
  caseType: 'Case type',
  motionType: 'Motion',
  party: 'Party',
}

export const JUDGE_FILTER_VALUES: Record<JudgeFilterKey, Record<string, string>> = {
  dateRange: {
    'all-time': 'All time',
    '12-months': 'Last 12 months',
    '24-months': 'Last 24 months',
    '36-months': 'Last 3 years',
  },
  caseType: {
    all: 'All',
    civil: 'Civil',
    criminal: 'Criminal',
    family: 'Family',
    probate: 'Probate',
  },
  motionType: {
    all: 'All',
    summary_judgment: 'Summary judgment',
    discovery: 'Discovery',
    dismissal: 'Dismissal',
    injunction: 'Injunction',
  },
  party: {
    'all-parties': 'All parties',
    plaintiff: 'Plaintiff',
    defendant: 'Defendant',
    petitioner: 'Petitioner',
    respondent: 'Respondent',
  },
}

export const JUDGE_FILTER_DEFAULT_ENTRIES = Object.entries(JUDGE_FILTER_DEFAULTS) as Array<[
  JudgeFilterKey,
  string
]>

export const getDefaultJudgeFilters = (): JudgeFilterState => ({
  dateRange: JUDGE_FILTER_DEFAULTS.dateRange,
  caseType: JUDGE_FILTER_DEFAULTS.caseType,
  motionType: JUDGE_FILTER_DEFAULTS.motionType,
  party: JUDGE_FILTER_DEFAULTS.party,
})
