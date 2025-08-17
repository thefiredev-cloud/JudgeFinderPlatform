"use client"

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

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
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <div className="mx-auto max-w-7xl px-4">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link
              href="/"
              className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Home className="h-4 w-4 mr-1" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              
              {item.current ? (
                <span 
                  className="font-medium text-gray-900"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
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
                'item': 'https://judgefinder.io'
              },
              ...items.map((item, index) => ({
                '@type': 'ListItem',
                'position': index + 2,
                'name': item.label,
                'item': `https://judgefinder.io${item.href}`
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
  courtName: string
): BreadcrumbItem[] {
  const jurisdictionSlug = jurisdiction.toLowerCase().replace(/\s+/g, '-')
  
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
      href: `/courts/${courtName.toLowerCase().replace(/\s+/g, '-')}`
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
  jurisdiction: string
): BreadcrumbItem[] {
  const jurisdictionSlug = jurisdiction.toLowerCase().replace(/\s+/g, '-')
  
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
      href: '#',
      current: true
    }
  ]
}