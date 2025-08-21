/**
 * Sync Queue Manager
 * Handles queuing and processing of sync jobs
 */

import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'
import { CourtSyncManager } from './court-sync'
import { JudgeSyncManager } from './judge-sync'
import { DecisionSyncManager } from './decision-sync'

export type SyncJobType = 'court' | 'judge' | 'decision' | 'full' | 'cleanup'
export type SyncJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface SyncJob {
  id: string
  type: SyncJobType
  status: SyncJobStatus
  options: any
  priority: number
  scheduled_for: string
  started_at?: string
  completed_at?: string
  result?: any
  error_message?: string
  retry_count: number
  max_retries: number
  created_at: string
  updated_at: string
}

export interface QueueStats {
  pending: number
  running: number
  completed: number
  failed: number
  total: number
}

export class SyncQueueManager {
  private supabase: any
  private isProcessing = false
  private processingInterval: NodeJS.Timeout | null = null

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  /**
   * Add a sync job to the queue
   */
  async addJob(
    type: SyncJobType,
    options: any = {},
    priority: number = 0,
    scheduledFor?: Date,
    maxRetries: number = 3
  ): Promise<string> {
    const job = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      status: 'pending' as SyncJobStatus,
      options,
      priority,
      scheduled_for: (scheduledFor || new Date()).toISOString(),
      retry_count: 0,
      max_retries: maxRetries,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error } = await this.supabase
      .from('sync_queue')
      .insert(job)

    if (error) {
      throw new Error(`Failed to add job to queue: ${error.message}`)
    }

    logger.info('Job added to sync queue', { 
      jobId: job.id, 
      type: job.type, 
      priority: job.priority 
    })

    return job.id
  }

  /**
   * Get next job to process
   */
  async getNextJob(): Promise<SyncJob | null> {
    const { data, error } = await this.supabase
      .from('sync_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get next job: ${error.message}`)
    }

    return data
  }

  /**
   * Mark job as running
   */
  async startJob(jobId: string): Promise<void> {
    const { error } = await this.supabase
      .from('sync_queue')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (error) {
      throw new Error(`Failed to start job: ${error.message}`)
    }
  }

  /**
   * Mark job as completed
   */
  async completeJob(jobId: string, result: any): Promise<void> {
    const { error } = await this.supabase
      .from('sync_queue')
      .update({
        status: 'completed',
        result,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (error) {
      throw new Error(`Failed to complete job: ${error.message}`)
    }
  }

  /**
   * Mark job as failed and potentially retry
   */
  async failJob(jobId: string, error: Error, shouldRetry: boolean = true): Promise<void> {
    const { data: job } = await this.supabase
      .from('sync_queue')
      .select('retry_count, max_retries')
      .eq('id', jobId)
      .single()

    const canRetry = shouldRetry && job && job.retry_count < job.max_retries
    
    const updateData: any = {
      error_message: error.message,
      updated_at: new Date().toISOString()
    }

    if (canRetry) {
      // Schedule for retry (exponential backoff)
      const retryDelay = Math.pow(2, job.retry_count) * 60 * 1000 // Minutes in milliseconds
      const retryAt = new Date(Date.now() + retryDelay)
      
      updateData.status = 'pending'
      updateData.scheduled_for = retryAt.toISOString()
      updateData.retry_count = job.retry_count + 1
      updateData.started_at = null
    } else {
      updateData.status = 'failed'
      updateData.completed_at = new Date().toISOString()
    }

    const { error: updateError } = await this.supabase
      .from('sync_queue')
      .update(updateData)
      .eq('id', jobId)

    if (updateError) {
      throw new Error(`Failed to fail job: ${updateError.message}`)
    }

    if (canRetry) {
      logger.info('Job scheduled for retry', { 
        jobId, 
        retryCount: job.retry_count + 1, 
        retryAt: updateData.scheduled_for 
      })
    } else {
      logger.error('Job failed permanently', { jobId, error: error.message })
    }
  }

  /**
   * Process a single job
   */
  async processJob(job: SyncJob): Promise<void> {
    logger.info('Processing sync job', { 
      jobId: job.id, 
      type: job.type, 
      attempt: job.retry_count + 1 
    })

    try {
      await this.startJob(job.id)

      let result: any
      
      switch (job.type) {
        case 'court':
          const courtSync = new CourtSyncManager()
          result = await courtSync.syncCourts(job.options)
          break

        case 'judge':
          const judgeSync = new JudgeSyncManager()
          result = await judgeSync.syncJudges(job.options)
          break

        case 'decision':
          const decisionSync = new DecisionSyncManager()
          result = await decisionSync.syncDecisions(job.options)
          break

        case 'full':
          // Full sync - run all sync types in sequence
          result = await this.runFullSync(job.options)
          break

        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }

      await this.completeJob(job.id, result)
      
      logger.info('Job completed successfully', { 
        jobId: job.id, 
        type: job.type, 
        result: result.success 
      })

    } catch (error) {
      logger.error('Job processing failed', { 
        jobId: job.id, 
        type: job.type, 
        error 
      })
      
      await this.failJob(job.id, error as Error)
    }
  }

  /**
   * Run full sync (all data types)
   */
  async runFullSync(options: any = {}) {
    const results: {
      court: any | null;
      judge: any | null;
      decision: any | null;
      success: boolean;
      duration: number;
    } = {
      court: null,
      judge: null,
      decision: null,
      success: false,
      duration: 0
    }

    const startTime = Date.now()

    try {
      // 1. Sync courts first
      logger.info('Starting court sync in full sync')
      const courtSync = new CourtSyncManager()
      results.court = await courtSync.syncCourts(options.court || {})

      // 2. Sync judges
      logger.info('Starting judge sync in full sync')
      const judgeSync = new JudgeSyncManager()
      results.judge = await judgeSync.syncJudges(options.judge || {})

      // 3. Sync decisions
      logger.info('Starting decision sync in full sync')
      const decisionSync = new DecisionSyncManager()
      results.decision = await decisionSync.syncDecisions(options.decision || {})

      results.duration = Date.now() - startTime
      results.success = !!(results.court?.success && results.judge?.success && results.decision?.success)

      return results

    } catch (error) {
      results.duration = Date.now() - startTime
      results.success = false
      throw error
    }
  }

  /**
   * Start queue processing
   */
  startProcessing(intervalMs: number = 30000): void {
    if (this.isProcessing) {
      logger.warn('Queue processing already started')
      return
    }

    this.isProcessing = true
    
    logger.info('Starting queue processing', { intervalMs })

    this.processingInterval = setInterval(async () => {
      try {
        const job = await this.getNextJob()
        
        if (job) {
          await this.processJob(job)
        }
      } catch (error) {
        logger.error('Queue processing error', { error })
      }
    }, intervalMs)
  }

  /**
   * Stop queue processing
   */
  stopProcessing(): void {
    if (!this.isProcessing) {
      return
    }

    this.isProcessing = false
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }

    logger.info('Queue processing stopped')
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    const { data, error } = await this.supabase
      .from('sync_queue')
      .select('status')

    if (error) {
      throw new Error(`Failed to get queue stats: ${error.message}`)
    }

    const stats: QueueStats = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      total: data?.length || 0
    }

    data?.forEach((job: any) => {
      stats[job.status as keyof Omit<QueueStats, 'total'>]++
    })

    return stats
  }

  /**
   * Clear completed and failed jobs older than specified days
   */
  async cleanupOldJobs(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const { data, error } = await this.supabase
      .from('sync_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('completed_at', cutoffDate.toISOString())
      .select('id')

    if (error) {
      throw new Error(`Failed to cleanup old jobs: ${error.message}`)
    }

    const deletedCount = data?.length || 0
    
    logger.info('Cleaned up old sync jobs', { 
      deletedCount, 
      olderThanDays 
    })

    return deletedCount
  }

  /**
   * Cancel pending jobs of a specific type
   */
  async cancelJobs(type?: SyncJobType): Promise<number> {
    let query = this.supabase
      .from('sync_queue')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'pending')

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query.select('id')

    if (error) {
      throw new Error(`Failed to cancel jobs: ${error.message}`)
    }

    const cancelledCount = data?.length || 0
    
    logger.info('Cancelled sync jobs', { 
      type: type || 'all', 
      cancelledCount 
    })

    return cancelledCount
  }
}