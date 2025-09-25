import { toTitle, normalizeOutcomeLabel } from '@/lib/sync/normalization'
import { type CourtListenerDocket } from '@/lib/courtlistener/client'

export function formatDate(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toISOString().split('T')[0]
}

export function buildCourtListenerUrl(absoluteUrl?: string | null): string | null {
  if (!absoluteUrl) return null
  if (absoluteUrl.startsWith('http')) {
    return absoluteUrl
  }
  return `https://www.courtlistener.com${absoluteUrl}`
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function classifyCaseTypeFromDocket(docket: CourtListenerDocket): string {
  const nature = (docket.nature_of_suit || '').toLowerCase()
  const jurisdiction = (docket.jurisdiction_type || '').toLowerCase()
  const caseName = (docket.case_name || docket.case_name_short || '').toLowerCase()

  if (jurisdiction.includes('criminal') || nature.includes('criminal') || caseName.includes('people v')) {
    return 'Criminal'
  }
    if (
      jurisdiction.includes('family') ||
      nature.includes('domestic') ||
      nature.includes('family') ||
      caseName.includes('marriage') ||
      caseName.includes('custody')
    ) {
      return 'Family Law'
    }
    if (nature.includes('probate') || caseName.includes('estate')) {
      return 'Probate'
    }
    if (nature.includes('bankruptcy') || caseName.includes('bankruptcy')) {
      return 'Bankruptcy'
    }
    if (nature.includes('tax') || jurisdiction.includes('tax')) {
      return 'Tax'
    }
    if (nature.includes('labor') || nature.includes('employment')) {
      return 'Employment'
    }
    if (jurisdiction.includes('appeal') || caseName.includes('appeal')) {
      return 'Appeals'
    }
    if (nature.includes('traffic')) {
      return 'Traffic'
    }
    if (nature.includes('immigration') || caseName.includes('immigration')) {
      return 'Immigration'
    }
    if (nature.includes('insurance')) {
      return 'Insurance'
    }

    if (jurisdiction.includes('civil') || nature.includes('civil')) {
      return 'Civil Litigation'
    }

    return 'General Litigation'
}

export function buildCaseSummaryFromDocket(
  docket: CourtListenerDocket,
  filingDate: string,
  decisionDate: string | null,
  lastActivity: string | null
): string | null {
  const parts: string[] = []

  parts.push(`Filed ${filingDate}`)

  if (decisionDate) {
    parts.push(`Closed ${decisionDate}`)
  } else if (lastActivity && lastActivity !== filingDate) {
    parts.push(`Last activity ${lastActivity}`)
  }

  if (docket.nature_of_suit) {
    parts.push(`Nature: ${docket.nature_of_suit}`)
  }

  if (docket.jurisdiction_type) {
    parts.push(`Jurisdiction: ${toTitle(docket.jurisdiction_type)}`)
  }

  if (typeof docket.docket_entries_count === 'number' && docket.docket_entries_count > 0) {
    parts.push(`Entries: ${docket.docket_entries_count}`)
  }

  if (docket.assigned_to_str) {
    parts.push(`Assigned: ${docket.assigned_to_str}`)
  }

  if (parts.length === 0) {
    return null
  }

  return parts.join(' | ').substring(0, 500)
}

export function getDecisionKey(decision: { opinion_id?: number; id?: number; cluster_id?: number }): string {
  if (decision.opinion_id) return decision.opinion_id.toString()
  if (decision.id) return decision.id.toString()
  if (decision.cluster_id) return `cluster-${decision.cluster_id}`
  return `decision-${Date.now()}`
}

export function determineCaseOutcomeAndStatus(docket: CourtListenerDocket): {
  decisionDate: string | null
  status: 'pending' | 'decided' | 'settled' | 'dismissed'
  outcomeLabel: string | null
} {
  const decisionDate = formatDate(docket.date_terminated) || formatDate(docket.date_last_filing)
  const outcomeNormalized = normalizeOutcomeLabel(docket.status || (decisionDate ? 'Closed' : null))
  let status: 'pending' | 'decided' | 'settled' | 'dismissed'

  switch (outcomeNormalized.category) {
    case 'dismissed':
      status = 'dismissed'
      break
    case 'settled':
      status = 'settled'
      break
    case 'pending':
      status = decisionDate ? 'decided' : 'pending'
      break
    default:
      status = decisionDate ? 'decided' : 'pending'
      break
  }

  return { decisionDate, status, outcomeLabel: outcomeNormalized.label }
}


