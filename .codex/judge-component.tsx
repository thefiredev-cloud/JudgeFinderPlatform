'use client'

import type { Judge } from '@/types'
import { BiasPatternAnalysis } from '@/components/judges/BiasPatternAnalysis'

type Props = {
  judge: Judge
  showAnalytics?: boolean
}

// Template component used by the Codex CLI when scaffolding judge views
export function JudgeComponentTemplate({ judge, showAnalytics = true }: Props) {
  return (
    <div className="rounded-lg bg-gray-900 p-6">
      <div className="mb-4 text-white">
        <h3 className="text-xl font-semibold">{judge.name}</h3>
        {judge.court_name && (
          <p className="text-sm text-gray-300">{judge.court_name}</p>
        )}
      </div>

      {showAnalytics && <BiasPatternAnalysis judge={judge} />}
    </div>
  )
}

export default JudgeComponentTemplate
