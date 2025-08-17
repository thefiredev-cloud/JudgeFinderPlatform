import { z } from 'zod'
import { NextResponse } from 'next/server'
import { logger } from './logger'

// Common validation schemas
export const slugSchema = z.string()
  .min(1, 'Slug is required')
  .max(200, 'Slug too long')
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')

export const searchQuerySchema = z.string()
  .min(1, 'Search query is required')
  .max(100, 'Search query too long')
  .trim()

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
})

export const jurisdictionSchema = z.string()
  .min(2, 'Jurisdiction code must be at least 2 characters')
  .max(10, 'Jurisdiction code too long')
  .regex(/^[A-Z0-9]+$/, 'Jurisdiction must be uppercase letters and numbers only')
  .optional()

// Judge API specific schemas
export const judgeSearchParamsSchema = z.object({
  q: z.string().optional(),
  limit: z.string().optional().transform(val => parseInt(val || '20') || 20).pipe(z.number().int().min(1).max(100)),
  page: z.string().optional().transform(val => parseInt(val || '1') || 1).pipe(z.number().int().min(1)),
  jurisdiction: z.string().optional()
})

export const judgeBySlugParamsSchema = z.object({
  slug: slugSchema
})

export const judgeIdParamsSchema = z.object({
  id: z.string().uuid('Invalid judge ID format')
})

// Court API specific schemas
export const courtSearchParamsSchema = z.object({
  q: z.string().optional(),
  limit: z.string().optional().transform(val => parseInt(val || '20') || 20).pipe(z.number().int().min(1).max(100)),
  page: z.string().optional().transform(val => parseInt(val || '1') || 1).pipe(z.number().int().min(1)),
  jurisdiction: z.string().optional(),
  court_type: z.string().max(50).optional()
})

// Analytics API schemas
export const analyticsParamsSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  force: z.string().transform(val => val === 'true').optional()
})

// Validation helper function
export function validateParams<T>(
  schema: z.ZodSchema<T>,
  params: unknown,
  context?: string
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const result = schema.safeParse(params)
    
    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))

      logger.warn('Validation failed', {
        context,
        errors,
        receivedParams: params
      })

      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors
          },
          { status: 400 }
        )
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    logger.error('Validation error', { context }, error instanceof Error ? error : undefined)
    
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Internal validation error',
          code: 'VALIDATION_INTERNAL_ERROR'
        },
        { status: 500 }
      )
    }
  }
}

// URL search params validation helper
export function validateSearchParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams,
  context?: string
): { success: true; data: T } | { success: false; response: NextResponse } {
  const params = Object.fromEntries(searchParams.entries())
  return validateParams(schema, params, context)
}

// JSON body validation helper
export async function validateJsonBody<T>(
  schema: z.ZodSchema<T>,
  request: Request,
  context?: string
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json()
    return validateParams(schema, body, context)
  } catch (error) {
    logger.warn('Invalid JSON body', { context })
    
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Invalid JSON body',
          code: 'INVALID_JSON'
        },
        { status: 400 }
      )
    }
  }
}

// Custom validation functions
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

export function isValidSlug(value: string): boolean {
  return slugSchema.safeParse(value).success
}

export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .substring(0, 100) // Limit length
}

// Rate limiting validation
export const rateLimitSchema = z.object({
  requests: z.number().int().min(1).max(1000),
  windowMs: z.number().int().min(1000).max(3600000) // 1 second to 1 hour
})

// File upload validation (for future use)
export const fileUploadSchema = z.object({
  filename: z.string().max(255),
  size: z.number().int().max(10 * 1024 * 1024), // 10MB max
  type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
})