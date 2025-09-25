import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils/slug'
import { logger } from '@/lib/utils/logger'
import { MissingColumnError } from '@/lib/admin/migration-errors'

interface MigrationSummary {
  updatedJudges: number
  updatedCourts: number
  sampleJudges: Array<{ name: string; slug: string | null }>
  sampleCourts: Array<{ name: string; slug: string | null }>
}

interface ColumnCheckResult {
  judgeSlug: boolean
  courtSlug: boolean
  judgeColumns: string[]
  courtColumns: string[]
}

interface SluglessRecord {
  id: string
  name: string
  slug: string | null
}

export class MigrationCoordinator {
  private constructor(private readonly supabase: SupabaseClient) {}

  static async initialize(): Promise<MigrationCoordinator> {
    const supabase = await createServerClient()
    return new MigrationCoordinator(supabase)
  }

  async executeSlugBackfill(): Promise<MigrationSummary> {
    const columnStatus = await this.verifySlugColumns()
    if (!columnStatus.judgeSlug || !columnStatus.courtSlug) {
      throw new MissingColumnError(columnStatus)
    }

    const [updatedJudges, updatedCourts] = await Promise.all([
      this.backfillJudgeSlugs(),
      this.backfillCourtSlugs(),
    ])

    const [sampleJudges, sampleCourts] = await Promise.all([
      this.fetchSamples('judges'),
      this.fetchSamples('courts'),
    ])

    return {
      updatedJudges,
      updatedCourts,
      sampleJudges,
      sampleCourts,
    }
  }

  private async verifySlugColumns(): Promise<ColumnCheckResult> {
    const [judgeColumns, courtColumns] = await Promise.all([
      this.fetchColumns('judges'),
      this.fetchColumns('courts'),
    ])

    return {
      judgeSlug: judgeColumns.includes('slug'),
      courtSlug: courtColumns.includes('slug'),
      judgeColumns,
      courtColumns,
    }
  }

  private async fetchColumns(table: string): Promise<string[]> {
    const { data, error } = await this.supabase.from(table).select('*').limit(1)
    if (error) {
      throw new Error(`Failed to inspect ${table} columns: ${error.message}`)
    }
    return data?.[0] ? Object.keys(data[0]) : []
  }

  private async backfillJudgeSlugs(): Promise<number> {
    const records = await this.fetchSluglessRecords('judges')
    const updates = records.map((judge) => this.updateSlug('judges', judge))
    await Promise.all(updates)
    logger.info('MigrationCoordinator judge slugs backfilled', { count: records.length })
    return records.length
  }

  private async backfillCourtSlugs(): Promise<number> {
    const records = await this.fetchSluglessRecords('courts')
    const updates = records.map((court) => this.updateSlug('courts', court))
    await Promise.all(updates)
    logger.info('MigrationCoordinator court slugs backfilled', { count: records.length })
    return records.length
  }

  private async fetchSluglessRecords(table: 'judges' | 'courts'): Promise<SluglessRecord[]> {
    const { data, error } = await this.supabase
      .from(table)
      .select('id, name, slug')
      .or('slug.is.null,slug.eq.')

    if (error) {
      throw new Error(`Failed to fetch ${table} without slugs: ${error.message}`)
    }

    return data ?? []
  }

  private async updateSlug(table: 'judges' | 'courts', record: SluglessRecord): Promise<void> {
    const slug = generateSlug(record.name ?? record.id, { fallbackToId: true })
    await this.supabase.from(table).update({ slug }).eq('id', record.id)
  }

  private async fetchSamples(table: 'judges' | 'courts'): Promise<Array<{ name: string; slug: string | null }>> {
    const { data, error } = await this.supabase
      .from(table)
      .select('name, slug')
      .not('slug', 'is', null)
      .limit(5)

    if (error) {
      throw new Error(`Failed to fetch ${table} samples: ${error.message}`)
    }

    return data ?? []
  }
}

