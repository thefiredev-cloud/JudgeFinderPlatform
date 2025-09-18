"use client"
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import JudgeSummary from '@/components/judges/JudgeSummary'

function JudgeSummaryDemoContent() {
  const params = useSearchParams()
  const judgeId = params.get('judgeId') || ''
  const apiKey = params.get('key') || undefined

  if (!judgeId) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-semibold mb-4">Judge Summary Demo</h1>
        <p className="text-sm text-muted-foreground">Pass <span className="font-mono">?judgeId=&lt;uuid&gt;</span> (and optional <span className="font-mono">&key=</span>) in the URL.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Judge Summary</h1>
      <JudgeSummary judgeId={judgeId} apiKey={apiKey} />
    </div>
  )
}

export default function JudgeSummaryDemoPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 max-w-2xl">Loading…</div>}>
      <JudgeSummaryDemoContent />
    </Suspense>
  )
}


