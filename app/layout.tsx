import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: '%s | Judge Finder',
    default: 'Judge Finder - Find Your Assigned Judge & Hire Expert Attorneys',
  },
  description: 'Search our database of 10,000+ judges, learn about their background and ruling patterns, and find experienced attorneys who know how to work with them.',
  keywords: ['judges', 'attorneys', 'legal', 'court', 'law firm', 'judicial analytics'],
  authors: [{ name: 'Judge Finder' }],
  creator: 'Judge Finder',
  publisher: 'Judge Finder',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://judgefinder.com',
    title: 'Judge Finder - Find Your Assigned Judge & Hire Expert Attorneys',
    description: 'Search our database of 10,000+ judges, learn about their background and ruling patterns, and find experienced attorneys who know how to work with them.',
    siteName: 'Judge Finder',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Judge Finder - Find Your Assigned Judge & Hire Expert Attorneys',
    description: 'Search our database of 10,000+ judges, learn about their background and ruling patterns, and find experienced attorneys who know how to work with them.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased bg-judge-slate-950 text-white`}>
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}