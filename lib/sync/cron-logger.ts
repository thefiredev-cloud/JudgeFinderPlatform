import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface CronMetricOptions {
  route: '/api/cron/daily-sync' | '/api/cron/weekly-sync'
  metricName: 'cron_daily_sync' | 'cron_weekly_sync' | 'cron_daily_sync_manual' | 'cron_weekly_sync_manual'
  status: 'success' | 'error'
  startTime: number
  durationMs: number
  jobsQueued?: number
  ipAddress?: string
}

export async function logCronMetric(opts: CronMetricOptions) {
  try {
    const supabase = await createServiceRoleClient()
    const startIso = new Date(opts.startTime).toISOString()
    const endIso = new Date(opts.startTime + opts.durationMs).toISOString()
    const durationSeconds = Number((opts.durationMs / 1000).toFixed(2))

    const insertResult = await supabase.from('performance_metrics').insert({
      metric_name: opts.metricName,
      metric_value: durationSeconds,
      metric_delta: typeof opts.jobsQueued === 'number' ? opts.jobsQueued : null,
      metric_id: `start=${startIso}|end=${endIso}`,
      rating: opts.status,
      page_url: opts.route,
      page_type: 'cron',
      connection_type: 'cron',
      user_agent: 'cron-worker',
      ip_address: opts.ipAddress || 'unknown'
    })

    if (insertResult.error) {
      logger.warn('Failed to write cron metric', { error: insertResult.error, metric: opts.metricName })
    }
  } catch (error) {
    logger.warn('Cron metric logging error', { error, metric: opts.metricName })
  }
}
