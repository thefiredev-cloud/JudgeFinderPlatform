'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function ExploreJudgesCta(): JSX.Element {
  return (
    <div className="mt-8">
      <Link
        href="/judges"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary transition-colors"
      >
        Explore Judge Profiles
        <ArrowLeft className="h-4 w-4 rotate-180" />
      </Link>
    </div>
  )
}

