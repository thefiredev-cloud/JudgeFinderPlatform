#!/usr/bin/env ts-node
import 'dotenv/config'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createCanonicalCourtSlug, isValidCourtSlug } from '../lib/utils/slug'

type CourtRecord = {
  id: string
  name: string
  slug: string | null
}

const PAGE_SIZE = 1000

interface AuditResult {
  total: number
  missing: CourtRecord[]
  invalid: CourtRecord[]
  duplicates: Record<string, CourtRecord[]>
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

type SupabaseAny = SupabaseClient<any, 'public', any>

async function fetchAllCourts(client: SupabaseAny): Promise<CourtRecord[]> {
  const courts: CourtRecord[] = []
  let from = 0

  while (true) {
    const { data, error } = await client
      .from('courts')
      .select('id, name, slug')
      .order('name')
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      throw new Error(`Supabase fetch error: ${error.message}`)
    }
    
    if (!data || data.length === 0) {
      break
    }

    courts.push(
      ...data.map(row => ({
        id: String(row.id),
        name: String(row.name ?? ''),
        slug: row.slug === null || row.slug === undefined ? null : String(row.slug)
      }))
    )

    if (data.length < PAGE_SIZE) {
      break
    }

    from += PAGE_SIZE
  }

  return courts
}

function auditCourts(courts: CourtRecord[]): AuditResult {
  const missing: CourtRecord[] = []
  const invalid: CourtRecord[] = []
  const slugUsage = new Map<string, CourtRecord[]>()

  for (const court of courts) {
    const slug = court.slug?.trim() ?? ''

    if (!slug) {
      missing.push(court)
      continue
    }

    if (!isValidCourtSlug(slug)) {
      invalid.push(court)
    }

    const key = slug.toLowerCase()
    const existing = slugUsage.get(key) ?? []
    existing.push(court)
    slugUsage.set(key, existing)
  }

  const duplicates: Record<string, CourtRecord[]> = {}
  for (const [slug, entries] of slugUsage.entries()) {
    if (entries.length > 1) {
      duplicates[slug] = entries
    }
  }

  return {
    total: courts.length,
    missing,
    invalid,
    duplicates
  }
}

function buildUniqueSlug(name: string, taken: Set<string>, fallbackSuffix: string): string {
  let base = createCanonicalCourtSlug(name)
  if (!base || base.trim().length === 0) {
    base = `court-${fallbackSuffix}`
  }

  let candidate = base
  let counter = 1
  while (taken.has(candidate)) {
    candidate = `${base}-${counter}`
    counter += 1
  }

  taken.add(candidate)
  return candidate
}

async function applyFixes(
  client: SupabaseAny,
  audit: AuditResult,
  courts: CourtRecord[]
): Promise<void> {
  const taken = new Set<string>()
  for (const court of courts) {
    if (court.slug && isValidCourtSlug(court.slug)) {
      taken.add(court.slug)
    }
  }

  const updates: { id: string; slug: string }[] = []

  for (const court of audit.missing) {
    const slug = buildUniqueSlug(court.name, taken, court.id.slice(0, 8))
    updates.push({ id: court.id, slug })
  }

  for (const court of audit.invalid) {
    const slug = buildUniqueSlug(court.name, taken, court.id.slice(0, 8))
    updates.push({ id: court.id, slug })
  }

  for (const [slug, entries] of Object.entries(audit.duplicates)) {
    const [, ...rest] = entries
    for (const court of rest) {
      const newSlug = buildUniqueSlug(court.name, taken, court.id.slice(0, 8))
      updates.push({ id: court.id, slug: newSlug })
    }
    // ensure canonical slug for first entry stays reserved
    const primary = entries[0]
    if (primary.slug && isValidCourtSlug(primary.slug)) {
      taken.add(primary.slug)
    }
  }

  if (updates.length === 0) {
    console.log('No slug updates required.')
    return
  }

  console.log(`Applying ${updates.length} slug updates...`)

  for (const chunk of chunkUpdates(updates, 50)) {
    const { error } = await client
      .from('courts')
      .upsert(chunk, { onConflict: 'id' })

    if (error) {
      throw new Error(`Failed to update court slugs: ${error.message}`)
    }
  }

  console.log('Slug updates completed successfully.')
}

function chunkUpdates<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

async function main() {
  try {
    const shouldFix = process.argv.includes('--fix')
    const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

    const client: SupabaseAny = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
      db: { schema: 'public' }
    })

    console.log('Fetching courts from Supabase...')
    const courts = await fetchAllCourts(client)
    console.log(`Fetched ${courts.length} courts.`)

    const audit = auditCourts(courts)

    const duplicateCount = Object.values(audit.duplicates).reduce((total, items) => total + items.length, 0)

    console.log('\nCourt slug audit summary:')
    console.log(`  Total courts          : ${audit.total}`)
    console.log(`  Missing slugs         : ${audit.missing.length}`)
    console.log(`  Invalid slug formats  : ${audit.invalid.length}`)
    console.log(`  Duplicate slug entries: ${duplicateCount}`)

    if (!shouldFix) {
      console.log('\nRun with --fix to backfill and deduplicate slugs automatically.')
      return
    }

    await applyFixes(client, audit, courts)
  } catch (error) {
    console.error('Audit failed:', error)
    process.exitCode = 1
  }
}

void main()
