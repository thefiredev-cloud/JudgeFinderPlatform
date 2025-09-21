// SEO Monitoring and Analytics Configuration
// This file contains functions for tracking SEO performance and search rankings

import { getBaseUrl } from '@/lib/utils/baseUrl'

interface SEOMetrics {
  pageUrl: string
  judgeName: string
  searchKeywords: string[]
  rankingPosition?: number
  clickThroughRate?: number
  impressions?: number
  clicks?: number
  timestamp: string
}

interface SearchConsoleData {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  page: string
}

/**
 * Track judge name search performance
 * This would integrate with Google Search Console API in production
 */
export async function trackJudgeSearchPerformance(judgeName: string, jurisdiction: string): Promise<SEOMetrics | null> {
  try {
    // In production, this would call Google Search Console API
    // For now, we'll structure the data for future implementation
    
    const searchKeywords = [
      judgeName,
      `Judge ${judgeName}`,
      `${judgeName} ${jurisdiction}`,
      `The Honorable ${judgeName}`,
      `${judgeName} Superior Court`,
      `${judgeName} judicial profile`,
      `${judgeName} ruling patterns`,
      `attorneys before ${judgeName}`,
    ]

    const baseUrl = getBaseUrl()
    const metrics: SEOMetrics = {
      pageUrl: `${baseUrl}/judges/${judgeName.toLowerCase().replace(/\s+/g, '-')}`,
      judgeName,
      searchKeywords,
      timestamp: new Date().toISOString(),
    }

    // Log for analytics (in production, send to analytics service)
    console.log('SEO Tracking:', metrics)
    
    return metrics
  } catch (error) {
    console.error('SEO tracking error:', error)
    return null
  }
}

/**
 * Monitor core web vitals for judge pages
 */
export function trackCoreWebVitals() {
  if (typeof window === 'undefined') return

  // Track Largest Contentful Paint (LCP)
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      console.log('LCP:', lastEntry.startTime)
      
      // In production, send to analytics
      if (window.gtag) {
        window.gtag('event', 'web_vitals', {
          name: 'LCP',
          value: Math.round(lastEntry.startTime),
          event_category: 'Performance',
        })
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] })
  } catch (error) {
    console.warn('LCP tracking failed:', error)
  }

  // Track First Input Delay (FID)
  try {
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const fidEntry = entry as any // Cast to any for first-input entries
        const fidValue = fidEntry.processingStart ? fidEntry.processingStart - entry.startTime : 0
        console.log('FID:', fidValue)
        
        if (window.gtag) {
          window.gtag('event', 'web_vitals', {
            name: 'FID',
            value: Math.round(fidValue),
            event_category: 'Performance',
          })
        }
      })
    }).observe({ entryTypes: ['first-input'] })
  } catch (error) {
    console.warn('FID tracking failed:', error)
  }

  // Track Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const clsEntry = entry as any // Cast to any for layout-shift entries
        if (!clsEntry.hadRecentInput) {
          clsValue += clsEntry.value || 0
        }
      })
      
      console.log('CLS:', clsValue)
      
      if (window.gtag) {
        window.gtag('event', 'web_vitals', {
          name: 'CLS',
          value: Math.round(clsValue * 1000),
          event_category: 'Performance',
        })
      }
    }).observe({ entryTypes: ['layout-shift'] })
  } catch (error) {
    console.warn('CLS tracking failed:', error)
  }
}

/**
 * Track search intent and user behavior on judge pages
 */
export function trackJudgePageEngagement(judgeName: string, source?: string) {
  if (typeof window === 'undefined' || !window.gtag) return

  // Track page view with judge-specific data
  window.gtag('event', 'page_view', {
    page_title: `Judge ${judgeName}`,
    page_location: window.location.href,
    content_group1: 'Judge Profile',
    content_group2: judgeName,
    custom_parameter_1: source || 'direct',
  })

  // Track scroll depth for engagement
  let maxScroll = 0
  const trackScroll = () => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    )
    
    if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
      maxScroll = scrollPercent
      if (window.gtag) {
        window.gtag('event', 'scroll', {
          event_category: 'engagement',
          event_label: `${scrollPercent}%`,
          value: scrollPercent,
        })
      }
    }
  }
  
  window.addEventListener('scroll', trackScroll, { passive: true })
  
  // Track time on page
  const startTime = Date.now()
  window.addEventListener('beforeunload', () => {
    const timeOnPage = Math.round((Date.now() - startTime) / 1000)
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: 'time_on_page',
        value: timeOnPage,
        event_category: 'engagement',
      })
    }
  })
}

/**
 * Track attorney directory interactions
 */
export function trackAttorneyDirectoryUsage(judgeName: string, action: string) {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', 'attorney_directory_interaction', {
    event_category: 'attorney_directory',
    event_label: judgeName,
    action: action,
    judge_name: judgeName,
  })
}

/**
 * Track search queries that lead to judge pages
 */
export function trackSearchQuery(query: string, judgeName: string, found: boolean) {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', 'judge_search', {
    event_category: 'search',
    event_label: query,
    judge_name: judgeName,
    search_successful: found,
  })
}

/**
 * Generate SEO performance report for a judge
 */
export function generateSEOReport(judgeName: string): object {
  return {
    judgeName,
    lastUpdated: new Date().toISOString(),
    metrics: {
      structuredData: 'implemented',
      canonicalUrls: 'configured',
      metaTags: 'optimized',
      internalLinking: 'active',
      siteSpeed: 'monitored',
      mobileOptimized: true,
      schemaMarkup: 'comprehensive',
      breadcrumbs: 'implemented',
      socialSharing: 'optimized',
    },
    recommendations: [
      'Monitor Search Console for ranking improvements',
      'Track click-through rates for meta descriptions',
      'Analyze user engagement metrics',
      'Update content based on search trends',
      'Monitor competitor judge pages',
    ]
  }
}

/**
 * Client-side SEO monitoring setup
 */
export function initializeSEOMonitoring(judgeName: string) {
  if (typeof window === 'undefined') return

  // Initialize core web vitals tracking
  trackCoreWebVitals()
  
  // Track page engagement
  trackJudgePageEngagement(judgeName, document.referrer || 'direct')
  
  // Track ad performance if ads are loaded
  const observeAds = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element
          if (element.classList.contains('adsbygoogle') && element.getAttribute('data-ad-status') === 'filled') {
            window.gtag?.('event', 'ad_impression', {
              event_category: 'monetization',
              ad_slot: element.getAttribute('data-ad-slot'),
              judge_name: judgeName,
            })
          }
        }
      })
    })
  })
  
  observeAds.observe(document.body, { childList: true, subtree: true })
}

// Type declarations for global analytics
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}
