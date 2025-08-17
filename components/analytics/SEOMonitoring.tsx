"use client"

import { useEffect } from 'react'
import { initializeSEOMonitoring, trackJudgeSearchPerformance } from '@/lib/analytics/seo-monitoring'

interface SEOMonitoringProps {
  judgeName: string
  jurisdiction: string
  slug: string
}

export function SEOMonitoring({ judgeName, jurisdiction, slug }: SEOMonitoringProps) {
  useEffect(() => {
    // Initialize SEO monitoring when component mounts
    initializeSEOMonitoring(judgeName)
    
    // Track search performance data
    trackJudgeSearchPerformance(judgeName, jurisdiction)
    
    // Set up Google Analytics 4 tracking if available
    if (typeof window !== 'undefined' && window.gtag) {
      // Track custom dimensions for better analytics
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {
        custom_map: {
          custom_parameter_1: 'judge_name',
          custom_parameter_2: 'jurisdiction',
          custom_parameter_3: 'page_type'
        }
      })
      
      // Send enhanced page view
      window.gtag('event', 'page_view', {
        page_title: `Judge ${judgeName}`,
        page_location: window.location.href,
        judge_name: judgeName,
        jurisdiction: jurisdiction,
        page_type: 'judge_profile',
        content_group1: 'Legal Research',
        content_group2: 'Judge Profiles',
        content_group3: jurisdiction,
      })
    }
    
    // Track search console performance (would require API integration)
    const trackSearchConsoleData = async () => {
      try {
        // This would call your backend API that interfaces with Google Search Console
        const response = await fetch(`/api/seo/search-console?judge=${encodeURIComponent(judgeName)}`)
        if (response.ok) {
          const data = await response.json()
          console.log('Search Console data:', data)
        }
      } catch (error) {
        console.debug('Search Console API not configured:', error)
      }
    }
    
    trackSearchConsoleData()
    
  }, [judgeName, jurisdiction])

  // This component doesn't render anything visible
  return null
}

// Additional monitoring for attorney interactions
export function trackAttorneySlotClick(judgeName: string, slotPosition: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'attorney_slot_click', {
      event_category: 'attorney_directory',
      event_label: judgeName,
      value: slotPosition,
      judge_name: judgeName,
      slot_position: slotPosition,
    })
  }
}

// Track related judge clicks for internal linking analysis
export function trackRelatedJudgeClick(fromJudge: string, toJudge: string, linkPosition: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'related_judge_click', {
      event_category: 'internal_linking',
      event_label: `${fromJudge} to ${toJudge}`,
      from_judge: fromJudge,
      to_judge: toJudge,
      link_position: linkPosition,
    })
  }
}

// Track breadcrumb navigation
export function trackBreadcrumbClick(judgeName: string, breadcrumbLabel: string, position: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'breadcrumb_navigation', {
      event_category: 'navigation',
      event_label: breadcrumbLabel,
      judge_name: judgeName,
      breadcrumb_position: position,
    })
  }
}