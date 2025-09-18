import type { Judge, Court, Case } from '@/types'

// Basic type guards
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

export function isValidEmail(value: unknown): value is string {
  if (!isString(value)) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

export function isValidUUID(value: unknown): value is string {
  if (!isString(value)) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

export function isValidURL(value: unknown): value is string {
  if (!isString(value)) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

// Domain-specific type guards
export function isJudge(value: unknown): value is Judge {
  if (!isObject(value)) return false
  
  return (
    isValidUUID(value.id) &&
    isString(value.name) &&
    value.name.length > 0 &&
    isString(value.jurisdiction) &&
    value.jurisdiction.length > 0 &&
    (!value.court_name || isString(value.court_name)) &&
    (!value.appointed_date || isString(value.appointed_date)) &&
    (!value.education || isString(value.education)) &&
    (!value.bio || isString(value.bio)) &&
    (!value.profile_image_url || isValidURL(value.profile_image_url)) &&
    (!value.total_cases || isNumber(value.total_cases)) &&
    (!value.courtlistener_id || (isNumber(value.courtlistener_id) && value.courtlistener_id > 0))
  )
}

export function isCourt(value: unknown): value is Court {
  if (!isObject(value)) return false
  
  return (
    isValidUUID(value.id) &&
    isString(value.name) &&
    value.name.length > 0 &&
    isString(value.type) &&
    value.type.length > 0 &&
    isString(value.jurisdiction) &&
    value.jurisdiction.length > 0 &&
    (!value.address || isString(value.address) || isNumber(value.address)) &&
    (!value.phone || isString(value.phone)) &&
    (!value.website || isValidURL(value.website)) &&
    (!value.judge_count || isNumber(value.judge_count))
  )
}

export function isCase(value: unknown): value is Case {
  if (!isObject(value)) return false
  
  return (
    isValidUUID(value.id) &&
    isValidUUID(value.judge_id) &&
    isString(value.case_number) &&
    value.case_number.length > 0 &&
    (value.court_id === null || (isString(value.court_id) && isValidUUID(value.court_id))) &&
    (!value.case_type || isString(value.case_type)) &&
    (!value.filing_date || isString(value.filing_date)) &&
    (!value.outcome || isString(value.outcome)) &&
    (!value.summary || isString(value.summary)) &&
    (!value.status || isString(value.status)) &&
    (!value.courtlistener_id || isString(value.courtlistener_id)) &&
    (!value.source_url || isString(value.source_url)) &&
    (!value.jurisdiction || isString(value.jurisdiction))
  )
}

// API Response type guards
export function isJudgeArray(value: unknown): value is Judge[] {
  return isArray(value) && value.every(isJudge)
}

export function isCourtArray(value: unknown): value is Court[] {
  return isArray(value) && value.every(isCourt)
}

export function isCaseArray(value: unknown): value is Case[] {
  return isArray(value) && value.every(isCase)
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
  total_count?: number
  page?: number
  per_page?: number
  has_more?: boolean
}

export function isApiResponse<T>(
  value: unknown,
  dataGuard: (data: unknown) => data is T
): value is ApiResponse<T> {
  if (!isObject(value)) return false
  
  return (
    (!value.data || dataGuard(value.data)) &&
    (!value.error || isString(value.error)) &&
    (!value.message || isString(value.message)) &&
    (!value.total_count || isNumber(value.total_count)) &&
    (!value.page || isNumber(value.page)) &&
    (!value.per_page || isNumber(value.per_page)) &&
    (!value.has_more || isBoolean(value.has_more))
  )
}

// Validation helpers
export function validateAndExtract<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage?: string
): T {
  if (!guard(value)) {
    throw new Error(errorMessage || 'Validation failed')
  }
  return value
}

export function safeParseJSON<T>(
  jsonString: string,
  guard: (value: unknown) => value is T
): T | null {
  try {
    const parsed = JSON.parse(jsonString)
    return guard(parsed) ? parsed : null
  } catch {
    return null
  }
}

// Property validation
export function hasRequiredProperties<T extends Record<string, unknown>>(
  obj: unknown,
  properties: string[]
): obj is T {
  if (!isObject(obj)) return false
  
  return properties.every(prop => 
    prop in obj && obj[prop] !== undefined && obj[prop] !== null
  )
}

export function validateStringLength(
  value: unknown,
  minLength: number = 0,
  maxLength: number = Infinity
): value is string {
  return isString(value) && 
         value.length >= minLength && 
         value.length <= maxLength
}

export function validateNumberRange(
  value: unknown,
  min: number = -Infinity,
  max: number = Infinity
): value is number {
  return isNumber(value) && value >= min && value <= max
}

// Database record validation
export function isValidDatabaseRecord(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false
  
  // Must have an id field
  if (!value.id || !isValidUUID(value.id)) return false
  
  // Must have created_at or similar timestamp
  const hasTimestamp = Boolean(
    value.created_at || 
    value.updated_at || 
    value.date_created ||
    value.date_modified
  )
  
  return hasTimestamp
}

// Form data validation
export function isValidFormData(value: unknown): value is FormData {
  return value instanceof FormData
}

// Search params validation
export function validateSearchParams(searchParams: URLSearchParams): {
  query?: string
  page: number
  limit: number
  jurisdiction?: string
} {
  const query = searchParams.get('q') || undefined
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const jurisdiction = searchParams.get('jurisdiction') || undefined
  
  return {
    ...(query && { query: query.trim() }),
    page,
    limit,
    ...(jurisdiction && { jurisdiction })
  }
}

// Error type guards
export function isError(value: unknown): value is Error {
  return value instanceof Error
}

export function isHttpError(value: unknown): value is Error & { status: number } {
  return isError(value) && 'status' in value && isNumber(value.status)
}

// Runtime type assertion with logging
export function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  context: string
): T {
  if (!guard(value)) {
    const error = new Error(`Type assertion failed in ${context}`)
    console.error('Type assertion failed:', {
      context,
      receivedType: typeof value,
      receivedValue: value,
      stack: error.stack
    })
    throw error
  }
  return value
}
