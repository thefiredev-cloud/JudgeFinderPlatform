import { type SupabaseClient } from '@supabase/supabase-js'
import { normalizeCaseNumber, normalizeJurisdiction, normalizeOutcomeLabel, createDocketHash } from '@/lib/sync/normalization'
import { getDecisionKey } from '@/lib/sync/decision-helpers'

export interface CourtListenerDecision {
  id: number
  cluster_id: number
  case_name: string
  date_filed: string
  precedential_status: string
  author_id?: string
  author_str?: string
  date_created: string
  opinion_id?: number
}

export class DecisionRepository {
  private readonly supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async getExistingDecisions(judgeId: string, decisionIds: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>()
    if (decisionIds.length === 0) return map
    const { data } = await this.supabase
      .from('cases')
      .select('id, courtlistener_id')
      .eq('judge_id', judgeId)
      .in('courtlistener_id', decisionIds)
    for (const row of data || []) {
      if (row.courtlistener_id && row.id) map.set(row.courtlistener_id, row.id)
    }
    return map
  }

  async upsertDecision(judgeId: string, jurisdiction: string | null, decision: CourtListenerDecision): Promise<{ caseId: string | null; created: boolean }> {
    const decisionKey = getDecisionKey(decision)
    const normalizedJurisdiction = normalizeJurisdiction(jurisdiction)
    const caseNumberInfo = normalizeCaseNumber(`CL-${decision.cluster_id}`, decision.cluster_id)
    const filingDate = decision.date_filed || new Date().toISOString().split('T')[0]
    const docketHash = createDocketHash({
      caseNumberKey: caseNumberInfo.key,
      jurisdiction: normalizedJurisdiction,
      judgeId,
      courtlistenerId: decision.cluster_id ?? decision.id ?? null,
      filingDate
    })
    const outcomeNormalized = normalizeOutcomeLabel(decision.precedential_status || 'Decided')

    const caseRecord = {
      judge_id: judgeId,
      case_name: (decision.case_name || 'Unknown Case').substring(0, 500),
      case_number: caseNumberInfo.display || `CL-${decision.cluster_id}`,
      docket_hash: docketHash,
      decision_date: filingDate,
      filing_date: filingDate,
      case_type: 'Opinion' as const,
      status: 'decided' as const,
      outcome: outcomeNormalized.label,
      summary: decision.case_name ? `CourtListener opinion for ${decision.case_name}` : `CourtListener opinion ${decisionKey}`,
      courtlistener_id: decisionKey,
      jurisdiction: normalizedJurisdiction,
      updated_at: new Date().toISOString()
    }

    const onConflict = docketHash ? 'docket_hash' : 'case_number,jurisdiction'
    const { data, error } = await this.supabase
      .from('cases')
      .upsert(caseRecord, { onConflict })
      .select('id')
      .single()
    if (error) {
      throw new Error(`Failed to upsert decision: ${error.message}`)
    }
    return { caseId: data?.id || null, created: true }
  }

  async updateJudgeCaseCount(judgeId: string): Promise<void> {
    const { count } = await this.supabase
      .from('cases')
      .select('id', { count: 'exact', head: true })
      .eq('judge_id', judgeId)
      .eq('status', 'decided')
    await this.supabase
      .from('judges')
      .update({ total_cases: count ?? 0, updated_at: new Date().toISOString() })
      .eq('id', judgeId)
  }
}


