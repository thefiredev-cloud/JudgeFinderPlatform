import type { MetadataRoute } from 'next'
import { getBaseUrl } from '@/lib/utils/baseUrl'

const DEFAULT_DISALLOWED_PATHS = [
  '/api/',
  '/admin/',
  '/dashboard/',
  '/_next/',
  '/attorney-setup/',
  '/success/',
  '/private/',
]

const QUERY_PARAM_PATTERNS = ['utm_', 'session']

const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'CCBot',
  'anthropic-ai',
  'Claude-Web',
]

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getBaseUrl()

  const generalRules: MetadataRoute.Robots['rules'] = [
    {
      userAgent: '*',
      allow: '/',
      disallow: [
        ...DEFAULT_DISALLOWED_PATHS,
        ...QUERY_PARAM_PATTERNS.map((param) => `*?*${param}*`),
      ],
      crawlDelay: 1,
    },
    ...AI_CRAWLERS.map((crawler) => ({
      userAgent: crawler,
      disallow: ['/'],
    })),
    {
      userAgent: 'facebookexternalhit',
      allow: '/',
    },
    {
      userAgent: 'Twitterbot',
      allow: '/',
    },
    {
      userAgent: 'LinkedInBot',
      allow: '/',
    },
  ]

  return {
    rules: generalRules,
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}

