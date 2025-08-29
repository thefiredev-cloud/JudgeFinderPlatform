/**
 * Environment Variable Validator
 * Validates required environment variables and provides helpful error messages
 */

import { logger } from './logger'

export interface EnvVariable {
  name: string
  required: boolean
  description?: string
  validator?: (value: string) => boolean
  transform?: (value: string) => any
}

export interface EnvValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  values: Record<string, any>
}

// Define all required environment variables
const ENV_VARIABLES: EnvVariable[] = [
  // Supabase Configuration
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    validator: (value) => value.includes('supabase.co') || value.includes('supabase.io')
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous/public key',
    validator: (value) => value.length > 20
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (server-side only)',
    validator: (value) => value.length > 20
  },
  
  // Clerk Authentication
  {
    name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    required: true,
    description: 'Clerk publishable key',
    validator: (value) => value.length > 10 // Less strict - Clerk keys can have different formats
  },
  {
    name: 'CLERK_SECRET_KEY',
    required: true,
    description: 'Clerk secret key',
    validator: (value) => value.length > 10 // Less strict - Clerk keys can have different formats
  },
  {
    name: 'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
    required: false,
    description: 'Clerk sign-in URL',
    validator: (value) => value.startsWith('/')
  },
  {
    name: 'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
    required: false,
    description: 'Clerk sign-up URL',
    validator: (value) => value.startsWith('/')
  },
  {
    name: 'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL',
    required: false,
    description: 'Redirect URL after sign-in',
    validator: (value) => value.startsWith('/')
  },
  {
    name: 'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL',
    required: false,
    description: 'Redirect URL after sign-up',
    validator: (value) => value.startsWith('/')
  },
  
  // External APIs
  {
    name: 'COURTLISTENER_API_KEY',
    required: true,
    description: 'CourtListener API key for fetching court data',
    validator: (value) => value.length > 10
  },
  {
    name: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for AI analytics (fallback)',
    validator: (value) => value.startsWith('sk-')
  },
  {
    name: 'GOOGLE_AI_API_KEY',
    required: false,
    description: 'Google AI API key for primary analytics',
    validator: (value) => value.length > 20
  },
  
  // Application Configuration
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    required: true,
    description: 'Public site URL',
    validator: (value) => value.startsWith('http://') || value.startsWith('https://')
  },
  {
    name: 'NODE_ENV',
    required: false,
    description: 'Node environment',
    validator: (value) => ['development', 'production', 'test'].includes(value)
  },
  
  // Upstash Redis (for rate limiting)
  {
    name: 'UPSTASH_REDIS_REST_URL',
    required: false,
    description: 'Upstash Redis URL for rate limiting',
    validator: (value) => value.startsWith('https://')
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    required: false,
    description: 'Upstash Redis token',
    validator: (value) => value.length > 20
  },
  
  // Sentry Error Tracking
  {
    name: 'SENTRY_DSN',
    required: false,
    description: 'Sentry DSN for error tracking',
    validator: (value) => value.startsWith('https://')
  },
  {
    name: 'NEXT_PUBLIC_SENTRY_DSN',
    required: false,
    description: 'Public Sentry DSN for client-side errors',
    validator: (value) => value.startsWith('https://')
  }
]

/**
 * Validates all environment variables
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const values: Record<string, any> = {}
  
  for (const envVar of ENV_VARIABLES) {
    const value = process.env[envVar.name]
    
    // Check if required variable is missing
    if (envVar.required && !value) {
      errors.push(`Missing required environment variable: ${envVar.name}${envVar.description ? ` (${envVar.description})` : ''}`)
      continue
    }
    
    // Skip optional variables that are not set
    if (!envVar.required && !value) {
      continue
    }
    
    // Validate the value if validator is provided
    if (value && envVar.validator && !envVar.validator(value)) {
      errors.push(`Invalid value for ${envVar.name}: ${envVar.description || 'validation failed'}`)
      continue
    }
    
    // Transform value if transformer is provided
    if (value) {
      values[envVar.name] = envVar.transform ? envVar.transform(value) : value
    }
  }
  
  // Add warnings for optional but recommended variables
  if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
    warnings.push('No AI API keys configured. AI analytics features will be disabled.')
  }
  
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    warnings.push('Upstash Redis not configured. Rate limiting will be disabled.')
  }
  
  if (!process.env.SENTRY_DSN) {
    warnings.push('Sentry not configured. Error tracking will be disabled.')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    values
  }
}

/**
 * Validates environment on startup and logs results
 */
export function validateEnvironmentOnStartup(): boolean {
  const result = validateEnvironment()
  
  if (!result.valid) {
    logger.error('Environment validation failed', { errors: result.errors })
    console.error('\n❌ Environment Validation Failed:\n')
    result.errors.forEach(error => console.error(`   • ${error}`))
    console.error('\nPlease check your environment variables configuration.\n')
    
    // In production, we should fail fast
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
    
    return false
  }
  
  if (result.warnings.length > 0) {
    logger.warn('Environment validation warnings', { warnings: result.warnings })
    console.warn('\n⚠️ Environment Warnings:\n')
    result.warnings.forEach(warning => console.warn(`   • ${warning}`))
    console.warn('')
  }
  
  logger.info('Environment validation successful', { 
    configuredVars: Object.keys(result.values).length 
  })
  
  return true
}

/**
 * Get validated environment variable value
 */
export function getEnvVar(name: string): string | undefined {
  const envVar = ENV_VARIABLES.find(v => v.name === name)
  
  if (!envVar) {
    logger.warn(`Unknown environment variable requested: ${name}`)
    return process.env[name]
  }
  
  const value = process.env[name]
  
  if (envVar.required && !value) {
    logger.error(`Required environment variable missing: ${name}`)
    throw new Error(`Missing required environment variable: ${name}`)
  }
  
  if (value && envVar.validator && !envVar.validator(value)) {
    logger.error(`Invalid environment variable value: ${name}`)
    throw new Error(`Invalid value for environment variable: ${name}`)
  }
  
  return value
}

/**
 * Check if the environment is properly configured for production
 */
export function isProductionReady(): boolean {
  const result = validateEnvironment()
  
  // Check for production-specific requirements
  const productionRequirements = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'COURTLISTENER_API_KEY',
    'NEXT_PUBLIC_SITE_URL'
  ]
  
  const missingProduction = productionRequirements.filter(
    name => !process.env[name]
  )
  
  if (missingProduction.length > 0) {
    logger.error('Missing production environment variables', { 
      missing: missingProduction 
    })
    return false
  }
  
  return result.valid
}

/**
 * Generate environment variable template
 */
export function generateEnvTemplate(): string {
  const template = ENV_VARIABLES.map(envVar => {
    const required = envVar.required ? '# REQUIRED' : '# OPTIONAL'
    const description = envVar.description ? ` - ${envVar.description}` : ''
    return `${required}${description}\n${envVar.name}=`
  }).join('\n\n')
  
  return `# JudgeFinder Platform Environment Variables\n# Generated on ${new Date().toISOString()}\n\n${template}`
}