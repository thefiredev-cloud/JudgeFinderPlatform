import { Calendar, GraduationCap, Briefcase, Award } from 'lucide-react'
import type { Judge } from '@/types'

interface JudgeProfileProps {
  judge: Judge
}

export function JudgeProfile({ judge }: JudgeProfileProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Judge Profile</h2>
      
      <div className="space-y-6">
        {/* Bio */}
        <div>
          <h3 className="mb-2 font-semibold text-gray-900">Biography</h3>
          <p className="text-gray-600">{judge.bio}</p>
        </div>

        {/* Key Information */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Appointed</p>
              <p className="text-sm text-gray-600">
                {new Date(judge.appointed_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <GraduationCap className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Education</p>
              <p className="text-sm text-gray-600">{judge.education}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Briefcase className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Total Cases</p>
              <p className="text-sm text-gray-600">{judge.total_cases.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Award className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Reversal Rate</p>
              <p className="text-sm text-gray-600">{(judge.reversal_rate * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="border-t pt-6">
          <h3 className="mb-4 font-semibold text-gray-900">Key Metrics</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-2xl font-bold text-gray-900">
                {judge.average_decision_time} days
              </p>
              <p className="text-sm text-gray-600">Avg. Decision Time</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-2xl font-bold text-gray-900">
                {(judge.reversal_rate * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Reversal Rate</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-2xl font-bold text-gray-900">
                {judge.total_cases.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Cases</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}