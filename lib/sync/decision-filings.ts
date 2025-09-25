import { type SupabaseClient } from '@supabase/supabase-js'
import { type CourtListenerClient, type CourtListenerDocket } from '@/lib/courtlistener/client'
import { logger } from '@/lib/utils/logger'
import { createDocketHash, normalizeCaseNumber, normalizeJurisdiction } from '@/lib/sync/normalization'
import { formatDate, classifyCaseTypeFromDocket, buildCaseSummaryFromDocket, buildCourtListenerUrl } from '@/lib/sync/decision-helpers'

interface DecisionSyncOptions {
  batchSize?: number
  jurisdiction?: string
  daysSinceLast?: number
  judgeIds?: string[]
  maxDecisionsPerJudge?: number
  yearsBack?: number
  includeDockets?: boolean
  maxFilingsPerJudge?: number
  filingYearsBack?: number
  filingDaysSinceLast?: number
}

interface ExistingFilingMaps {
  byCaseNumber: Map<string, { id: string }>
  byHash: Map<string, { id: string }>
}

export async function syncJudgeFilings(
  supabase: SupabaseClient,
  courtListener: CourtListenerClient,
  judge: any,
  options: DecisionSyncOptions
) {
  const stats = {
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0
  }

  try {
    if (!judge.courtlistener_id) {
      return stats
    }

    const sinceDate = await getSinceDateForFilings(supabase, judge.id, options)
    const yearsBack = options.filingYearsBack ?? options.yearsBack ?? 5
    const maxRecords = options.maxFilingsPerJudge ?? 300

    const filings = await courtListener.getRecentDocketsByJudge(judge.courtlistener_id, {
      startDate: sinceDate,
      yearsBack,
      maxRecords
    })
    logger.info('Fetched recent docket filings from CourtListener', { judgeId: judge.courtlistener_id, count: filings.length })

    stats.processed = filings.length
    if (filings.length === 0) return stats

    const normalizedJurisdiction = normalizeJurisdiction(judge.jurisdiction)

    const preparedFilings = filings.map(docket => {
      const caseNumberInfo = normalizeCaseNumber(docket.docket_number ?? docket.pacer_case_id ?? null, docket.id)
      const filingDate = formatDate(docket.date_filed)
      const docketHash = createDocketHash({
        caseNumberKey: caseNumberInfo.key,
        jurisdiction: normalizedJurisdiction,
        judgeId: judge.id,
        courtlistenerId: docket.id,
        filingDate
      })
      return { docket, caseNumberInfo, filingDate, docketHash }
    })

    const existingFilings = await getExistingFilings(supabase, judge.id, preparedFilings.map(entry => ({
      caseNumber: entry.caseNumberInfo.display,
      docketHash: entry.docketHash
    })))

    for (const entry of preparedFilings) {
      const { docket, caseNumberInfo, filingDate, docketHash } = entry
      const caseNumber = caseNumberInfo.display
      if (!caseNumber || !filingDate) { stats.skipped++; continue }

      const record = buildCaseRecordFromDocket(judge, docket, filingDate, docketHash, normalizedJurisdiction)
      const existing = (docketHash ? existingFilings.byHash.get(docketHash) : undefined)
        || existingFilings.byCaseNumber.get(caseNumber)

      if (existing) {
        const { error: updateError } = await supabase
          .from('cases')
          .update(record)
          .eq('id', existing.id)
        if (updateError) {
          logger.error('Failed to update existing filing', { judgeId: judge.id, caseNumber, error: updateError })
          stats.skipped++
          continue
        }
        stats.updated++
        if (caseNumber) existingFilings.byCaseNumber.set(caseNumber, existing)
        if (docketHash) existingFilings.byHash.set(docketHash, existing)
      } else {
        const insertRecord = {
          ...record,
          judge_id: judge.id,
          case_number: caseNumber,
          docket_hash: docketHash,
          court_id: record.court_id ?? judge.court_id ?? null
        }
        const onConflict = docketHash ? 'docket_hash' : 'case_number,jurisdiction'
        const { data: inserted, error: insertError } = await supabase
          .from('cases')
          .upsert(insertRecord, { onConflict })
          .select('id, case_number, docket_hash')
          .single()
        if (insertError) {
          logger.error('Failed to insert filing', { judgeId: judge.id, caseNumber, error: insertError })
          stats.skipped++
          continue
        }
        if (inserted?.case_number) existingFilings.byCaseNumber.set(inserted.case_number, { id: inserted.id })
        if (inserted?.docket_hash) existingFilings.byHash.set(inserted.docket_hash, { id: inserted.id })
        stats.created++
      }
    }

    return stats
  } catch (error) {
    logger.error('Failed to sync docket filings for judge', { judgeId: judge.id, judgeName: judge.name, error })
    return stats
  }
}

async function getSinceDateForFilings(
  supabase: SupabaseClient,
  judgeId: string,
  options: DecisionSyncOptions
): Promise<string> {
  if (options.filingDaysSinceLast) {
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - options.filingDaysSinceLast)
    return daysAgo.toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('cases')
    .select('filing_date')
    .eq('judge_id', judgeId)
    .not('filing_date', 'is', null)
    .order('filing_date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    const yearsBack = options.filingYearsBack ?? options.yearsBack ?? 5
    const fallback = new Date()
    fallback.setFullYear(fallback.getFullYear() - yearsBack)
    return fallback.toISOString().split('T')[0]
  }

  const lastDate = new Date(data.filing_date)
  lastDate.setDate(lastDate.getDate() + 1)
  return lastDate.toISOString().split('T')[0]
}

async function getExistingFilings(
  supabase: SupabaseClient,
  judgeId: string,
  lookups: Array<{ caseNumber: string | null; docketHash: string | null }>
): Promise<ExistingFilingMaps> {
  const byCaseNumber = new Map<string, { id: string }>()
  const byHash = new Map<string, { id: string }>()
  if (!lookups || lookups.length === 0) return { byCaseNumber, byHash }

  const caseNumbers = new Set(lookups.map(l => l.caseNumber).filter((v): v is string => Boolean(v)))
  const docketHashes = new Set(lookups.map(l => l.docketHash).filter((v): v is string => Boolean(v)))
  if (caseNumbers.size === 0 && docketHashes.size === 0) return { byCaseNumber, byHash }

  const formatList = (values: Set<string>) => Array.from(values).map(v => `"${v.replace(/"/g, '\"')}"`).join(',')

  let query = supabase
    .from('cases')
    .select('id, case_number, docket_hash')
    .eq('judge_id', judgeId)

  const orFilters: string[] = []
  if (caseNumbers.size > 0) orFilters.push(`case_number.in.(${formatList(caseNumbers)})`)
  if (docketHashes.size > 0) orFilters.push(`docket_hash.in.(${formatList(docketHashes)})`)
  if (orFilters.length > 0) query = query.or(orFilters.join(','))

  const { data, error } = await query
  if (error) {
    logger.error('Failed to get existing filings', { error, judgeId })
    return { byCaseNumber, byHash }
  }

  for (const row of data || []) {
    if (row.case_number && row.id) byCaseNumber.set(row.case_number, { id: row.id })
    if (row.docket_hash && row.id) byHash.set(row.docket_hash, { id: row.id })
  }

  return { byCaseNumber, byHash }
}

function buildCaseRecordFromDocket(
  judge: any,
  docket: CourtListenerDocket,
  filingDate: string,
  docketHash: string | null,
  normalizedJurisdiction: string | null
) {
  const caseName = (docket.case_name || docket.case_name_short || 'Unknown Case').substring(0, 500)
  const decisionDate = formatDate(docket.date_terminated) || formatDate(docket.date_last_filing)
  const lastActivity = formatDate(docket.date_last_filing)
  const summary = buildCaseSummaryFromDocket(docket, filingDate, decisionDate, lastActivity)
  const caseType = classifyCaseTypeFromDocket(docket)

  return {
    case_name: caseName,
    case_type: caseType,
    filing_date: filingDate,
    decision_date: decisionDate,
    status: decisionDate ? 'decided' : 'pending',
    outcome: docket.status || (decisionDate ? 'Closed' : null),
    summary,
    court_id: judge.court_id ?? null,
    courtlistener_id: docket.id ? `docket-${docket.id}` : null,
    source_url: buildCourtListenerUrl(docket.absolute_url),
    jurisdiction: normalizedJurisdiction,
    docket_hash: docketHash
  }
}


