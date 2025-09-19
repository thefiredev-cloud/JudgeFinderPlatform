import { Redis } from '@upstash/redis'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { cache as memoryCache } from '@/lib/cache/simple-cache'
import {
  analyzeCaseTypePatterns,
  analyzeOutcomes,
  analyzeTemporalPatterns,
  calculateBiasIndicators,
  type BiasMetrics,
  type CaseRecord,
} from '@/lib/analytics/bias-calculations'

interface CourtBaseline {
  metrics: BiasMetrics
  sample_size: number
  generated_at: string
}

let redisClient: Redis | null = null

function getRedis() {
  if (redisClient) return redisClient
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redisClient = new Redis({ url, token })
  return redisClient
}

function cacheKey(courtId: string) {
  return `analytics:baseline:court:${courtId}`
}

export async function getCourtBaseline(courtId: string): Promise<CourtBaseline | null> {
  const key = cacheKey(courtId)
  const redis = getRedis()

  if (redis) {
    try {
      const cached = await redis.get<CourtBaseline>(key)
      if (cached) {
        return cached
      }
    } catch (error) {
      // ignore redis errors and fall back to in-memory cache
    }
  }

  const cached = memoryCache.get<CourtBaseline>(key)
  if (cached) {
    return cached
  }

  const supabase = await createServiceRoleClient()
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 3)

  const { data: caseRows, error } = await supabase
    .from('cases')
    .select('case_type, outcome, status, case_value, filing_date, decision_date')
    .eq('court_id', courtId)
    .not('decision_date', 'is', null)
    .gte('decision_date', cutoff.toISOString())
    .limit(10000)

  if (error || !caseRows) {
    return null
  }

  const records = caseRows as CaseRecord[]
  if (records.length === 0) {
    return null
  }

  const caseTypePatterns = analyzeCaseTypePatterns(records)
  const outcomeAnalysis = analyzeOutcomes(records)
  const temporalPatterns = analyzeTemporalPatterns(records)
  const biasIndicators = calculateBiasIndicators(records, caseTypePatterns, outcomeAnalysis)

  const baseline: CourtBaseline = {
    metrics: {
      case_type_patterns: caseTypePatterns,
      outcome_analysis: outcomeAnalysis,
      temporal_patterns: temporalPatterns,
      bias_indicators: biasIndicators,
    },
    sample_size: records.length,
    generated_at: new Date().toISOString(),
  }

  if (redis) {
    try {
      await redis.set(key, baseline, { ex: 3600 })
    } catch (error) {
      // ignore cache set failures
    }
  } else {
    memoryCache.set(key, baseline, 3600)
  }

  return baseline
}

export type { CourtBaseline }
