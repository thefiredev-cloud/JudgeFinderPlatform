import { Calendar, FileText, ExternalLink } from 'lucide-react'

interface RecentDecisionsProps {
  judgeId: string
}

export function RecentDecisions({ judgeId }: RecentDecisionsProps) {
  // Mock data - would be fetched based on judgeId
  const decisions = [
    {
      id: 1,
      case_name: 'Smith v. Johnson Corp',
      case_number: '2024-CV-1234',
      date: '2024-11-15',
      type: 'Summary Judgment',
      outcome: 'Granted for Defendant',
      summary: 'Motion for summary judgment granted on grounds of insufficient evidence of breach.'
    },
    {
      id: 2,
      case_name: 'State v. Williams',
      case_number: '2024-CR-5678',
      date: '2024-11-10',
      type: 'Sentencing',
      outcome: '5 Years Probation',
      summary: 'Defendant sentenced to probation with community service requirements.'
    },
    {
      id: 3,
      case_name: 'Tech Innovations LLC v. DataCorp',
      case_number: '2024-CV-9012',
      date: '2024-11-05',
      type: 'Patent Dispute',
      outcome: 'Settled',
      summary: 'Parties reached settlement agreement during mediation.'
    },
    {
      id: 4,
      case_name: 'Rodriguez v. City Hospital',
      case_number: '2024-CV-3456',
      date: '2024-10-28',
      type: 'Medical Malpractice',
      outcome: 'Jury Verdict - Plaintiff',
      summary: 'Jury awarded $2.3M in damages for medical negligence.'
    }
  ]

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Recent Decisions</h2>
        <button className="text-sm text-blue-600 hover:text-blue-700">
          View All →
        </button>
      </div>

      <div className="space-y-4">
        {decisions.map((decision) => (
          <div
            key={decision.id}
            className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
          >
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{decision.case_name}</h3>
                <p className="text-sm text-gray-500">{decision.case_number}</p>
              </div>
              <button className="text-gray-400 hover:text-blue-600">
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-2 flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-800">
                {decision.type}
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-gray-800">
                {decision.outcome}
              </span>
            </div>

            <p className="mb-2 text-sm text-gray-600">{decision.summary}</p>

            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="mr-1 h-3 w-3" />
              {new Date(decision.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}