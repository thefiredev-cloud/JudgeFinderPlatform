// Performance monitoring utilities
interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  context?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 1000
  
  // Track API response times
  trackApiCall(endpoint: string, duration: number, status: number, context?: Record<string, any>) {
    this.addMetric(`api.${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`, duration, {
      status,
      ...context
    })
  }
  
  // Track database query times
  trackDatabaseQuery(table: string, operation: string, duration: number, context?: Record<string, any>) {
    this.addMetric(`db.${table}.${operation}`, duration, context)
  }
  
  // Track component render times
  trackComponentRender(component: string, duration: number) {
    this.addMetric(`component.${component}`, duration)
  }
  
  // Track cache performance
  trackCacheOperation(operation: 'hit' | 'miss' | 'set', key: string, duration?: number) {
    this.addMetric(`cache.${operation}`, duration || 1, { key })
  }
  
  // Generic metric tracking
  trackMetric(name: string, value: number, context?: Record<string, any>) {
    this.addMetric(name, value, context)
  }
  
  private addMetric(name: string, value: number, context?: Record<string, any>) {
    // Remove old metrics if we exceed max
    if (this.metrics.length >= this.maxMetrics) {
      this.metrics = this.metrics.slice(-Math.floor(this.maxMetrics * 0.8))
    }
    
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      context
    })
  }
  
  // Get performance summary
  getMetricsSummary(timeRangeMs?: number) {
    const cutoffTime = timeRangeMs ? Date.now() - timeRangeMs : 0
    const relevantMetrics = this.metrics.filter(m => m.timestamp > cutoffTime)
    
    const summary: Record<string, {
      count: number
      avg: number
      min: number
      max: number
      p95: number
    }> = {}
    
    // Group metrics by name
    const grouped = relevantMetrics.reduce((groups, metric) => {
      if (!groups[metric.name]) groups[metric.name] = []
      groups[metric.name].push(metric.value)
      return groups
    }, {} as Record<string, number[]>)
    
    // Calculate statistics for each metric
    Object.entries(grouped).forEach(([name, values]) => {
      values.sort((a, b) => a - b)
      const sum = values.reduce((a, b) => a + b, 0)
      const p95Index = Math.floor(values.length * 0.95)
      
      summary[name] = {
        count: values.length,
        avg: sum / values.length,
        min: values[0],
        max: values[values.length - 1],
        p95: values[p95Index] || values[values.length - 1]
      }
    })
    
    return summary
  }
  
  // Get slow queries/operations
  getSlowOperations(threshold: number = 1000, timeRangeMs?: number) {
    const cutoffTime = timeRangeMs ? Date.now() - timeRangeMs : 0
    return this.metrics
      .filter(m => m.timestamp > cutoffTime && m.value > threshold)
      .sort((a, b) => b.value - a.value)
      .slice(0, 50) // Top 50 slowest
  }
  
  // Clear old metrics
  cleanup() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo)
  }
  
  // Export metrics for external monitoring
  exportMetrics() {
    return {
      timestamp: Date.now(),
      metrics: this.metrics,
      summary: this.getMetricsSummary(5 * 60 * 1000), // Last 5 minutes
      slowOperations: this.getSlowOperations(500) // Operations over 500ms
    }
  }
}

// Global performance monitor
const performanceMonitor = new PerformanceMonitor()

// Cleanup old metrics every 10 minutes
setInterval(() => {
  performanceMonitor.cleanup()
}, 10 * 60 * 1000)

// Helper function to measure execution time
export function measureTime<T>(fn: () => Promise<T>, name: string, context?: Record<string, any>): Promise<T>
export function measureTime<T>(fn: () => T, name: string, context?: Record<string, any>): T
export function measureTime<T>(fn: () => T | Promise<T>, name: string, context?: Record<string, any>) {
  const start = Date.now()
  
  try {
    const result = fn()
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = Date.now() - start
        performanceMonitor.trackMetric(name, duration, context)
      })
    } else {
      const duration = Date.now() - start
      performanceMonitor.trackMetric(name, duration, context)
      return result
    }
  } catch (error) {
    const duration = Date.now() - start
    performanceMonitor.trackMetric(name, duration, { ...context, error: true })
    throw error
  }
}

// Middleware wrapper for API routes
export function withPerformanceTracking(handler: Function, routeName: string) {
  return async (req: any, res: any, ...args: any[]) => {
    const start = Date.now()
    
    try {
      const result = await handler(req, res, ...args)
      const duration = Date.now() - start
      
      performanceMonitor.trackApiCall(routeName, duration, res.statusCode || 200, {
        method: req.method,
        hasQuery: Object.keys(req.query || {}).length > 0
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - start
      performanceMonitor.trackApiCall(routeName, duration, 500, {
        method: req.method,
        error: true
      })
      throw error
    }
  }
}

export { performanceMonitor }