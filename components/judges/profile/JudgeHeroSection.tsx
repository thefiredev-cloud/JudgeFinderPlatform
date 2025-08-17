import type { Judge } from '@/types'

interface JudgeHeroSectionProps {
  judge: Judge
  safeName: string
  safeCourtName: string
  safeJurisdiction: string
}

export function JudgeHeroSection({ 
  judge, 
  safeName, 
  safeCourtName, 
  safeJurisdiction 
}: JudgeHeroSectionProps) {
  const nameWithoutTitle = safeName.replace(/^(judge|justice|the honorable)\s+/i, '').trim()
  
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start space-x-6">
          {/* Judge Photo */}
          <div className="flex-shrink-0">
            <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-600">
                {nameWithoutTitle.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>
          
          {/* Judge Information */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Judge {nameWithoutTitle}
            </h1>
            <p className="mt-2 text-xl text-gray-600">
              {safeCourtName}
            </p>
            <p className="mt-1 text-lg text-gray-500">
              {safeJurisdiction} Jurisdiction
            </p>
            
            {/* Quick Stats */}
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium">Cases:</span>
                <span className="ml-1">{judge.total_cases || 0}</span>
              </div>
              {judge.appointed_date && (
                <div className="flex items-center text-sm text-gray-500">
                  <span className="font-medium">Appointed:</span>
                  <span className="ml-1">
                    {new Date(judge.appointed_date).getFullYear()}
                  </span>
                </div>
              )}
              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium">Status:</span>
                <span className="ml-1 text-green-600">Active</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex-shrink-0 flex flex-col space-y-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              View Analytics
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Save Judge
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}