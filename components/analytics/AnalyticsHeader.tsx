'use client'

import Link from 'next/link'
import { ArrowLeft, BarChart3 } from 'lucide-react'

interface AnalyticsHeaderProps {
  title: string
  subtitle: string
}

export function AnalyticsHeader({ title, subtitle }: AnalyticsHeaderProps): JSX.Element {
  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          <p className="text-xl text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

