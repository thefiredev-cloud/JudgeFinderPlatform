"use client"

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

import { resolveCourtSlug } from '@/lib/utils/slug'
import { getBaseUrl } from '@/lib/utils/baseUrl'

interface BreadcrumbItem {
  label: string
  href: string
  current?: boolean
}

interface SEOBreadcrumbsProps {
  items: BreadcrumbItem[]
  judgeName?: string
  jurisdiction?: string
}

export function SEOBreadcrumbs({ items, judgeName, jurisdiction }: SEOBreadcrumbsProps) {
  const baseUrl = getBaseUrl()
  return (
    <nav aria-label="Breadcrumb" className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-3">
      <div className="mx-auto max-w-7xl px-4">
        <ol className="flex items-center flex-wrap gap-2 text-sm">
          <li>
            <Link
              href="/"
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <Home className="h-4 w-4 mr-1" />
              <span>Home</span>
            </Link>
          </li>
          
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600 mx-1" />
              
              {item.current ? (
                <span 
                  className="font-medium text-gray-900 dark:text-gray-100"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Structured Data for Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': [
              {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Home',
                'item': baseUrl
              },
              ...items.map((item, index) => ({
                '@type': 'ListItem',
                'position': index + 2,
                'name': item.label,
                'item': `${baseUrl}${item.href}`
              }))
            ]
          })
        }}
      />

      {/* Additional SEO Context */}
      {judgeName && jurisdiction && (
        <div className="hidden">
          {/* Hidden content for search engines */}
          <span>
            Judge {judgeName} serves in {jurisdiction}. Research judicial analytics, 
            ruling patterns, and find qualified attorneys with experience before this judge.
          </span>
        </div>
      )}
    </nav>
  )
}

// Helper function to generate breadcrumbs for judge pages
export function generateJudgeBreadcrumbs(
  judgeName: string, 
  jurisdiction: string, 
  courtName: string,
  courtSlug?: string | null
): BreadcrumbItem[] {
  const jurisdictionSlug = jurisdiction.toLowerCase().replace(/\s+/g, '-')
  const preferredCourtSlug =
    courtSlug || resolveCourtSlug({ slug: courtSlug, name: courtName }) || 'unknown-court'
  
  return [
    {
      label: 'Judges',
      href: '/judges'
    },
    {
      label: jurisdiction,
      href: `/jurisdictions/${jurisdictionSlug}`
    },
    {
      label: courtName,
      href: `/courts/${preferredCourtSlug}`
    },
    {
      label: `Judge ${judgeName}`,
      href: '#',
      current: true
    }
  ]
}

// Helper function for court pages
export function generateCourtBreadcrumbs(
  courtName: string,
  jurisdiction: string,
  courtSlug?: string | null
): BreadcrumbItem[] {
  const jurisdictionSlug = jurisdiction.toLowerCase().replace(/\s+/g, '-')
  const preferredCourtSlug =
    courtSlug || resolveCourtSlug({ slug: courtSlug, name: courtName }) || 'unknown-court'
  
  return [
    {
      label: 'Courts',
      href: '/courts'
    },
    {
      label: jurisdiction,
      href: `/jurisdictions/${jurisdictionSlug}`
    },
    {
      label: courtName,
      href: `/courts/${preferredCourtSlug}`,
      current: true
    }
  ]
}
