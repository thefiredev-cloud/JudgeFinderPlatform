import './globals.css'
import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import { Providers } from '@/components/providers/Providers'
import { Header } from '@/components/ui/Header'
import { Footer } from '@/components/ui/Footer'
import BottomNavigation from '@/components/ui/BottomNavigation'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary'
import { getBaseUrl } from '@/lib/utils/baseUrl'
import { DonationButton } from '@/components/fundraising/DonationButton'

const BASE_URL = getBaseUrl()

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  // Ensure absolute URLs for Open Graph/Twitter images
  metadataBase: new URL(BASE_URL),
  title: 'JudgeFinder.io - Find Information About Your Judge',
  description: 'Find information about your assigned judge. Understand what to expect in your court appearance with simple, clear insights.',
  keywords: 'find judge, court appearance, judge information, California judges, court preparation',
  openGraph: {
    title: 'JudgeFinder.io - Find Your Judge',
    description: 'Get information about your assigned judge',
    url: BASE_URL,
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
  alternates: {
    canonical: BASE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JudgeFinder.io - Find Your Judge',
    description: 'Get information about your assigned judge',
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
    <html lang="en" suppressHydrationWarning className={`${inter.className} dark`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        {/* Performance: DNS Prefetch + Preconnect for common origins */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <>
            <link rel="dns-prefetch" href={new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin} />
            <link rel="preconnect" href={new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin} crossOrigin="anonymous" />
          </>
        )}
        <link rel="dns-prefetch" href="https://www.courtlistener.com" />
        <link rel="preconnect" href="https://www.courtlistener.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="JudgeFinder" />
        <meta name="application-name" content="JudgeFinder" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
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
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <GlobalErrorBoundary>
          <Providers>
            <ServiceWorkerRegistration />
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <div className="mx-auto hidden w-full max-w-6xl items-center justify-end px-4 py-3 md:flex">
                <DonationButton amount={25} variant="header" />
              </div>
              <main id="main-content" className="flex-1 pb-16 md:pb-0">
                {children}
              </main>
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
