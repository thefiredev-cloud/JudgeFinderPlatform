import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { Header } from '@/components/ui/Header'
import { Footer } from '@/components/ui/Footer'
import BottomNavigation from '@/components/ui/BottomNavigation'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JudgeFinder.io - Legal Analytics & Judge Research Platform',
  description: 'Comprehensive legal analytics platform providing insights into judicial decisions, ruling patterns, and case outcomes. Research judges and courts with data-driven intelligence.',
  keywords: 'legal analytics, judge research, court decisions, judicial patterns, case outcomes, legal intelligence',
  openGraph: {
    title: 'JudgeFinder.io - Legal Analytics Platform',
    description: 'Research judges and courts with data-driven intelligence',
    url: 'https://judgefinder.io',
    siteName: 'JudgeFinder.io',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JudgeFinder.io - Legal Analytics Platform',
    description: 'Research judges and courts with data-driven intelligence',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="JudgeFinder" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="google-site-verification" content="your-google-search-console-verification-code" />
        <meta name="msvalidate.01" content="your-bing-webmaster-verification-code" />
        {process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT && (
          <script 
            async 
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <GlobalErrorBoundary>
          <Providers>
            <ServiceWorkerRegistration />
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 pb-16 md:pb-0">{children}</main>
              <div className="mb-16 md:mb-0">
                <Footer />
              </div>
              <BottomNavigation />
            </div>
          </Providers>
        </GlobalErrorBoundary>
      </body>
    </html>
  )
}