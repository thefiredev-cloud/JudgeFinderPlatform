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
    <div className="bg-background/60 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start space-x-6">
          {/* Judge Photo */}
          <div className="flex-shrink-0">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl font-bold text-muted-foreground">
                {nameWithoutTitle.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>
          
          {/* Judge Information */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              Judge {nameWithoutTitle}
            </h1>
            <p className="mt-2 text-xl text-muted-foreground">
              {safeCourtName}
            </p>
            <p className="mt-1 text-lg text-muted-foreground">
              {safeJurisdiction} Jurisdiction
            </p>
            
            {/* Quick Stats */}
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="font-medium">Cases:</span>
                <span className="ml-1">{judge.total_cases || 0}</span>
              </div>
              {judge.appointed_date && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="font-medium">Appointed:</span>
                  <span className="ml-1">
                    {new Date(judge.appointed_date).getFullYear()}
                  </span>
                </div>
              )}
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="font-medium">Status:</span>
                <span className="ml-1 text-emerald-400">Active</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex-shrink-0 flex flex-col space-y-2">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              View Analytics
            </button>
            <button className="border border-border text-foreground px-4 py-2 rounded-lg hover:bg-accent/20 transition-colors">
              Save Judge
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
