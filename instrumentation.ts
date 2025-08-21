export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { init } = await import('@sentry/nextjs')
    
    const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

    if (SENTRY_DSN) {
      init({
        dsn: SENTRY_DSN,
        // Performance Monitoring
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        
        debug: process.env.NODE_ENV === 'development',
        
        environment: process.env.NODE_ENV,
        
        // Configure which errors to send
        beforeSend(event, hint) {
          // Don't send errors in development unless specifically configured
          if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
            return null
          }
          
          return event
        },
        
        // Additional configuration for server-side
        initialScope: {
          tags: {
            component: 'server',
          },
        },
      })
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const { init } = await import('@sentry/nextjs')
    
    const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

    if (SENTRY_DSN) {
      init({
        dsn: SENTRY_DSN,
        // Performance Monitoring
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        
        debug: process.env.NODE_ENV === 'development',
        
        environment: process.env.NODE_ENV,
        
        // Additional configuration for edge runtime
        initialScope: {
          tags: {
            component: 'edge',
          },
        },
      })
    }
  }
}