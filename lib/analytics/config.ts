const DEFAULT_MIN_SAMPLE_SIZE = 15
const DEFAULT_GOOD_SAMPLE_SIZE = 40

function parseEnvNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

function parseEnvBoolean(value: string | undefined, fallback: boolean) {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false
  return fallback
}

export const MIN_SAMPLE_SIZE = parseEnvNumber(process.env.NEXT_PUBLIC_MIN_SAMPLE_SIZE, DEFAULT_MIN_SAMPLE_SIZE)
export const GOOD_SAMPLE_SIZE = parseEnvNumber(process.env.NEXT_PUBLIC_GOOD_SAMPLE_SIZE, DEFAULT_GOOD_SAMPLE_SIZE)
export const HIDE_METRICS_BELOW_SAMPLE = parseEnvBoolean(
  process.env.NEXT_PUBLIC_HIDE_SAMPLE_BELOW_MIN,
  true
)

export type QualityTier = 'LOW' | 'GOOD' | 'HIGH'

export function getQualityTier(sampleSize?: number | null, confidence?: number | null): QualityTier {
  if (!sampleSize || sampleSize < MIN_SAMPLE_SIZE) {
    return 'LOW'
  }

  if (sampleSize >= Math.max(GOOD_SAMPLE_SIZE, MIN_SAMPLE_SIZE * 2) && (confidence ?? 0) >= 80) {
    return 'HIGH'
  }

  if ((confidence ?? 0) >= 70) {
    return 'GOOD'
  }

  return sampleSize >= MIN_SAMPLE_SIZE ? 'GOOD' : 'LOW'
}

export function isBelowSampleThreshold(sampleSize?: number | null) {
  return !sampleSize || sampleSize < MIN_SAMPLE_SIZE
}

export function shouldHideMetric(sampleSize?: number | null) {
  return HIDE_METRICS_BELOW_SAMPLE && isBelowSampleThreshold(sampleSize)
}
