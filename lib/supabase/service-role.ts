import { createClient, type SupabaseClient } from '@supabase/supabase-js'

interface SupabaseServiceRoleConfig {
  url: string
  serviceRoleKey: string
}

export class SupabaseServiceRoleFactory {
  private readonly config: SupabaseServiceRoleConfig

  constructor(config: SupabaseServiceRoleConfig) {
    this.config = config
  }

  create(): SupabaseClient {
    return createClient(this.config.url, this.config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${this.config.serviceRoleKey}`
        }
      }
    })
  }
}

export function createServiceRoleClient(url: string, serviceRoleKey: string): SupabaseClient {
  return new SupabaseServiceRoleFactory({ url, serviceRoleKey }).create()
}
