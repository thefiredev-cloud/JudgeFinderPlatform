import type { Judge } from '@/types'
import { Calendar, Scale, Briefcase, Award } from 'lucide-react'

interface JudgeMainContentProps {
  judge: Judge
  safeName: string
  safeCourtName: string
  safeJurisdiction: string
}

export function JudgeMainContent({ 
  judge, 
  safeName, 
  safeCourtName, 
  safeJurisdiction 
}: JudgeMainContentProps) {
  const nameWithoutTitle = safeName.replace(/^(judge|justice|the honorable)\s+/i, '').trim()
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile and Analytics */}
        <div className="lg:col-span-2 space-y-8">
          {/* SEO Content Section */}
          <div className="rounded-lg border border-border bg-card shadow-sm p-6">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              About Judge {nameWithoutTitle}
            </h2>
            
            <div className="prose max-w-none text-muted-foreground dark:prose-invert">
              <p className="leading-relaxed mb-4">
                Judge {nameWithoutTitle} serves the {safeJurisdiction} jurisdiction at {safeCourtName}, 
                bringing extensive judicial experience to the bench. Our comprehensive profile provides 
                essential insights into judicial patterns, case analytics, and courtroom procedures 
                to help attorneys and litigants prepare effective legal strategies.
              </p>
              
              <p className="leading-relaxed mb-4">
                Through our advanced analytics platform, legal professionals can access detailed 
                information about Judge {nameWithoutTitle}'s ruling tendencies, case management style, 
                and procedural preferences. This intelligence enables more effective case preparation 
                and strategic decision-making in legal proceedings.
              </p>
              
              <p className="leading-relaxed">
                Whether you're researching judicial background for case strategy, analyzing courtroom 
                patterns for procedural insights, or seeking transparency in judicial decision-making, 
                our platform provides the comprehensive data and analysis you need to make informed 
                legal decisions.
              </p>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="rounded-lg border border-border bg-card shadow-sm p-6">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center">
              <Scale className="h-5 w-5 mr-2 text-primary" />
              Judicial Analytics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Civil Case Patterns</span>
                  <span className="font-semibold text-primary">Analyzing...</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Decision Timeline</span>
                  <span className="font-semibold text-emerald-400">
                    {judge.average_decision_time || 'N/A'} days
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Case Load</span>
                  <span className="font-semibold text-purple-400">{judge.total_cases || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Court Experience</span>
                  <span className="font-semibold text-orange-400">Experienced</span>
                </div>
              </div>
            </div>
          </div>

          {/* Case History */}
          <div className="rounded-lg border border-border bg-card shadow-sm p-6">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-emerald-400" />
              Recent Case Activity
            </h3>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Comprehensive case analytics and judicial patterns are being processed. 
                Our system analyzes court records and judicial decisions to provide 
                insights into ruling tendencies and case management approaches.
              </p>
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/10">
                <p className="text-sm text-primary">
                  <strong>Analytics Live:</strong> Explore the analytics panels below for ruling patterns,
                  case timelines, and decision insights generated from recent court data.
                </p>
              </div>
            </div>
          </div>

          {/* Professional Background */}
          <div className="rounded-lg border border-border bg-card shadow-sm p-6">
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center">
              <Award className="h-5 w-5 mr-2 text-purple-400" />
              Professional Background
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-foreground mb-3">Court Assignment</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Court:</span>
                    <span className="font-medium">{safeCourtName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jurisdiction:</span>
                    <span className="font-medium">{safeJurisdiction}</span>
                  </div>
                  {judge.appointed_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Appointed:</span>
                      <span className="font-medium">
                        {new Date(judge.appointed_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-3">Case Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Cases:</span>
                    <span className="font-medium">{judge.total_cases || 0}</span>
                  </div>
                  {judge.average_decision_time && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Decision Time:</span>
                      <span className="font-medium">{judge.average_decision_time} days</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium text-emerald-400">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional SEO Content */}
          <div className="rounded-lg border border-border bg-card shadow-sm p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Legal Research and Case Strategy
            </h3>
            <div className="prose max-w-none text-muted-foreground dark:prose-invert">
              <p className="mb-4">
                Understanding judicial patterns and preferences is crucial for effective legal 
                representation. Judge {nameWithoutTitle}'s profile provides valuable insights 
                into courtroom procedures, case management approaches, and decision-making patterns 
                that can inform your legal strategy.
              </p>
              
              <p className="mb-4">
                Our analytics platform processes court records, case outcomes, and procedural 
                data to provide comprehensive judicial intelligence. This information helps 
                attorneys prepare more effectively, anticipate courtroom dynamics, and develop 
                strategies aligned with judicial preferences and established precedents.
              </p>
              
              <p>
                For litigants and legal researchers, this transparency into judicial 
                decision-making promotes accountability and helps ensure fair and informed 
                legal proceedings. Access to comprehensive judicial data supports the 
                principles of open courts and transparent justice.
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Column - Sidebar Content */}
        <div className="space-y-6">
          {/* Quick Facts */}
          <div className="rounded-lg border border-border bg-card shadow-sm p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Quick Facts</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground/70 mr-2" />
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="ml-auto font-medium">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Scale className="h-4 w-4 text-muted-foreground/70 mr-2" />
                <span className="text-muted-foreground">Court Type:</span>
                <span className="ml-auto font-medium">
                  State Court
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground/70 mr-2" />
                <span className="text-muted-foreground">Active Cases:</span>
                <span className="ml-auto font-medium">
                  {judge.total_cases || 0}
                </span>
              </div>
            </div>
          </div>
          
          {/* Research Tips */}
          <div className="rounded-lg border border-accent/30 bg-accent/10 p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Research Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Review recent case analytics for patterns</li>
              <li>• Check procedural preferences and timing</li>
              <li>• Analyze ruling tendencies by case type</li>
              <li>• Review court rules and local procedures</li>
              <li>• Consider historical case outcomes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
