import crypto from 'crypto'

export type OutcomeCategory =
  | 'judgment_plaintiff'
  | 'judgment_defendant'
  | 'dismissed'
  | 'settled'
  | 'vacated'
  | 'remanded'
  | 'pending'
  | 'closed'
  | 'other'

const ROLE_ALIASES: Record<string, string> = {
  plaintiff: 'plaintiff',
  pltf: 'plaintiff',
  pet: 'petitioner',
  petitioner: 'petitioner',
  prose: 'pro se',
  respondent: 'respondent',
  resp: 'respondent',
  defendant: 'defendant',
  deft: 'defendant',
  appellee: 'appellee',
  appellant: 'appellant',
  pros: 'prosecution',
  prosecutor: 'prosecution',
  da: 'prosecution',
  state: 'prosecution',
  publicdefender: 'public defender',
  defense: 'defense',
  guardianadlitum: 'guardian ad litem',
}

const OUTCOME_PATTERNS: Array<{ category: OutcomeCategory; label: string; patterns: RegExp[] }> = [
  {
    category: 'dismissed',
    label: 'Dismissed',
    patterns: [/dismiss/i, /thrown out/i, /quash/i, /terminated/i],
  },
  {
    category: 'settled',
    label: 'Settled',
    patterns: [/settle/i, /stipulated judgment/i],
  },
  {
    category: 'vacated',
    label: 'Vacated',
    patterns: [/vacated?/i, /set aside/i],
  },
  {
    category: 'remanded',
    label: 'Remanded',
    patterns: [/remand/i],
  },
  {
    category: 'judgment_plaintiff',
    label: 'Judgment for Plaintiff',
    patterns: [/plaintiff/i, /for the plaintiff/i, /grant.*plaintiff/i],
  },
  {
    category: 'judgment_defendant',
    label: 'Judgment for Defendant',
    patterns: [/defendant/i, /for the defendant/i, /grant.*defendant/i],
  },
  {
    category: 'pending',
    label: 'Active',
    patterns: [/pending/i, /active/i, /open/i],
  },
  {
    category: 'closed',
    label: 'Closed',
    patterns: [/closed/i, /disposed/i, /completed/i],
  },
]

export interface NormalizedOutcome {
  label: string | null
  category: OutcomeCategory
}

export interface NormalizedCaseNumber {
  display: string | null
  key: string | null
}

export function normalizePartyRole(role?: string | null): string | null {
  if (!role) return null
  const trimmed = role.toLowerCase().replace(/[^a-z]/g, '')
  return ROLE_ALIASES[trimmed] || role.trim().toLowerCase()
}

export function normalizeOutcomeLabel(raw?: string | null): NormalizedOutcome {
  const value = (raw || '').trim()
  if (!value) {
    return { label: null, category: 'other' }
  }

  for (const mapping of OUTCOME_PATTERNS) {
    if (mapping.patterns.some(pattern => pattern.test(value))) {
      return { label: mapping.label, category: mapping.category }
    }
  }

  return { label: toTitle(value), category: 'other' }
}

export function normalizeJurisdiction(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const upper = trimmed.toUpperCase()
  if (upper === 'USA' || upper === 'UNITED STATES' || upper === 'FEDERAL' || upper === 'US') {
    return 'US'
  }

  if (/^[A-Z]{2}$/.test(upper)) {
    return upper
  }

  if (upper.includes('CALIFORNIA')) return 'CA'
  if (upper.includes('NEW YORK')) return 'NY'

  return upper.length <= 4 ? upper : upper.slice(0, 4)
}

export function normalizeCaseNumber(raw?: string | number | null, fallback?: string | number | null): NormalizedCaseNumber {
  if (raw === null || raw === undefined) {
    return fallback ? normalizeCaseNumber(String(fallback)) : { display: null, key: null }
  }

  const str = String(raw).trim()
  if (!str) {
    return fallback ? normalizeCaseNumber(String(fallback)) : { display: null, key: null }
  }

  const display = str
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .slice(0, 100)

  const key = display.replace(/[^A-Z0-9]/g, '')

  return {
    display,
    key: key.length ? key : null
  }
}

export function createDocketHash(options: {
  caseNumberKey: string | null
  jurisdiction?: string | null
  judgeId?: string | null
  courtlistenerId?: string | number | null
  filingDate?: string | null
}): string | null {
  const parts = [
    options.caseNumberKey ? options.caseNumberKey.toUpperCase() : '',
    options.jurisdiction ? options.jurisdiction.toUpperCase() : '',
    options.judgeId ? options.judgeId.toString() : '',
    options.courtlistenerId ? options.courtlistenerId.toString() : '',
    options.filingDate ? options.filingDate.slice(0, 10) : ''
  ]

  const payload = parts.filter(Boolean).join('|')
  if (!payload) {
    return null
  }

  return crypto.createHash('sha1').update(payload).digest('hex')
}

export function toTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)\w/g, match => match.toUpperCase())
}
