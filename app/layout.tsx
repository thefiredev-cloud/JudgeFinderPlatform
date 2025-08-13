import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { Header } from '@/components/ui/Header'
import { Footer } from '@/components/ui/Footer'
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
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}