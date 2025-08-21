import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    debug: process.env.NODE_ENV === 'development',
    
    environment: process.env.NODE_ENV,
    
    // Additional SDK configuration
    beforeSend(event, hint) {
      // Filter out development errors we don't care about
      if (process.env.NODE_ENV === 'development') {
        // Skip some common development errors
        if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
          return null
        }
      }
      
      return event
    },
    
    // Integrations will be automatically included by @sentry/nextjs
    integrations: [],
  })
}