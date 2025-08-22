import { createServerClient } from './server'
import { SupabaseClient } from '@supabase/supabase-js'

interface ConnectionConfig {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
}

export class SupabaseConnectionHelper {
  private static instance: SupabaseConnectionHelper
  private client: SupabaseClient | null = null
  private config: ConnectionConfig

  constructor(config: ConnectionConfig = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 10000,
      ...config
    }
  }

  static getInstance(config?: ConnectionConfig): SupabaseConnectionHelper {
    if (!SupabaseConnectionHelper.instance) {
      SupabaseConnectionHelper.instance = new SupabaseConnectionHelper(config)
    }
    return SupabaseConnectionHelper.instance
  }

  async getClient(): Promise<SupabaseClient> {
    if (!this.client) {
      this.client = await createServerClient()
    }
    return this.client
  }

  async testConnection(): Promise<{ success: boolean; error?: string; latency?: number }> {
    const startTime = Date.now()
    
    try {
      const client = await this.getClient()
      const { data, error } = await client
        .from('judges')
        .select('id')
        .limit(1)

      const latency = Date.now() - startTime

      if (error) {
        return { success: false, error: error.message, latency }
      }

      return { success: true, latency }
    } catch (error) {
      const latency = Date.now() - startTime
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown connection error',
        latency 
      }
    }
  }

  async executeWithRetry<T>(
    operation: (client: SupabaseClient) => Promise<T>,
    customRetries?: number
  ): Promise<T> {
    const retries = customRetries ?? this.config.maxRetries!
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const client = await this.getClient()
        return await operation(client)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        if (attempt === retries) {
          break
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay! * attempt))
        
        // Reset client connection for retry
        this.client = null
      }
    }

    throw new Error(`Operation failed after ${retries} attempts: ${lastError?.message}`)
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: {
      connection: boolean
      query: boolean
      latency: number
    }
    error?: string
  }> {
    const startTime = Date.now()
    
    try {
      const connectionTest = await this.testConnection()
      const latency = Date.now() - startTime

      if (!connectionTest.success) {
        return {
          status: 'unhealthy',
          checks: {
            connection: false,
            query: false,
            latency
          },
          error: connectionTest.error
        }
      }

      // Test a more complex query
      const client = await this.getClient()
      const { error: countError } = await client
        .from('judges')
        .select('*', { count: 'exact', head: true })

      if (countError) {
        return {
          status: 'degraded',
          checks: {
            connection: true,
            query: false,
            latency: connectionTest.latency!
          },
          error: countError.message
        }
      }

      return {
        status: 'healthy',
        checks: {
          connection: true,
          query: true,
          latency: connectionTest.latency!
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        checks: {
          connection: false,
          query: false,
          latency: Date.now() - startTime
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}