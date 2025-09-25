import { type SupabaseClient } from '@supabase/supabase-js'
import { type CourtListenerClient } from '@/lib/courtlistener/client'
import { stripHtml } from '@/lib/sync/decision-helpers'
import { logger } from '@/lib/utils/logger'

export async function ensureOpinionForCase(
  supabase: SupabaseClient,
  courtListener: CourtListenerClient,
  caseId: string,
  decision: { opinion_id?: number; id?: number; cluster_id?: number; author_str?: string; date_filed?: string }
): Promise<void> {
  const opinionId = decision.opinion_id ?? decision.id
  if (!opinionId) return

  const { data: existingOpinion } = await supabase
    .from('opinions')
    .select('id')
    .eq('case_id', caseId)
    .eq('courtlistener_id', opinionId.toString())
    .maybeSingle()
  if (existingOpinion) return

  try {
    const opinionDetail = await courtListener.getOpinionDetail(opinionId)
    const plainText = opinionDetail?.plain_text
      || (opinionDetail?.html ? stripHtml(opinionDetail.html) : null)
      || (opinionDetail?.html_with_citations ? stripHtml(opinionDetail.html_with_citations) : null)
    if (!plainText) {
      logger.warn('Opinion detail missing text', { opinionId })
      return
    }

    const opinionRecord = {
      case_id: caseId,
      cluster_id: opinionDetail?.cluster?.toString() || decision.cluster_id?.toString() || null,
      opinion_type: opinionDetail?.type || 'lead',
      author_judge_id: null,
      author_name: opinionDetail?.author_str || decision.author_str || null,
      per_curiam: opinionDetail?.per_curiam ?? false,
      opinion_text: plainText,
      html_text: opinionDetail?.html || null,
      plain_text: plainText,
      courtlistener_id: opinionId.toString(),
      date_created: opinionDetail?.date_created || decision.date_filed || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('opinions')
      .upsert(opinionRecord, { onConflict: 'courtlistener_id' })
    if (error) {
      logger.error('Failed to upsert opinion', { error, opinionId })
    }
  } catch (error) {
    logger.error('Failed to fetch opinion detail', { opinionId, error })
  }
}


