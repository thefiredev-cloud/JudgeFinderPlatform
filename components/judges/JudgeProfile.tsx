'use client'

import { Calendar, GraduationCap, Building2, MapPin, Clock, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { BookmarkButton } from './BookmarkButton'
import type { Judge } from '@/types'

interface JudgeProfileProps {
  judge: Judge
}

export function JudgeProfile({ judge }: JudgeProfileProps) {
  // Helper function to get consistent court and state display
  const getCourtAndStateDisplay = () => {
    const courtName = judge.court_name || 'Court not specified'
    const state = judge.jurisdiction || 'Unknown jurisdiction'
    
    // Format consistently as "Court Name, State"
    if (courtName === 'Court not specified' && state === 'Unknown jurisdiction') {
      return 'Court and jurisdiction not specified'
    }
    
    return `${courtName}, ${state}`
  }

  // Extract real data from CourtListener if available
  const courtlistenerData = judge.courtlistener_data
  
  // Calculate years of service from real appointment date or estimated from positions
  let appointmentDate = null
  let yearsOfService = null
  
  if (judge.appointed_date) {
    appointmentDate = new Date(judge.appointed_date)
    yearsOfService = new Date().getFullYear() - appointmentDate.getFullYear()
  } else if (courtlistenerData?.positions?.length && courtlistenerData.positions.length > 0) {
    // Find earliest judicial appointment from positions
    const judicialPositions = courtlistenerData.positions
      .filter((pos: any) => pos.position_type && ['jud', 'c-jud', 'jus', 'c-jus'].includes(pos.position_type))
      .sort((a: any, b: any) => (a.date_start || '').localeCompare(b.date_start || ''))
    
    if (judicialPositions.length > 0 && judicialPositions[0].date_start) {
      appointmentDate = new Date(judicialPositions[0].date_start)
      yearsOfService = new Date().getFullYear() - appointmentDate.getFullYear()
    }
  }
  
  // Use comprehensive education data from CourtListener
  const education = courtlistenerData?.educations?.length && courtlistenerData.educations.length > 0 
    ? courtlistenerData.educations
        .map((edu: any) => {
          const school = edu.school?.name || edu.school_name || ''
          const degree = edu.degree || ''
          return [school, degree].filter(Boolean).join(' - ')
        })
        .filter(Boolean)
        .join('; ')
    : judge.education || null

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Clean Header with Profile Info */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white pt-8 px-6 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">{judge.name}</h1>
                <div className="flex items-center text-blue-100 text-sm mb-3">
                  <Building2 className="h-4 w-4 mr-2" />
                  {getCourtAndStateDisplay()}
                </div>
                
                {/* Key Info Pills */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {appointmentDate && (
                    <span className="inline-flex items-center bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-medium">
                      <Calendar className="h-3 w-3 mr-1" />
                      Appointed {appointmentDate.getFullYear()}
                    </span>
                  )}
                  {yearsOfService !== null && (
                    <span className="inline-flex items-center bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-medium">
                      <Clock className="h-3 w-3 mr-1" />
                      {yearsOfService} Years Experience
                    </span>
                  )}
                  {education && (
                    <span className="inline-flex items-center bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-medium">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {education.split(';')[0].trim()}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-2 ml-4">
                <BookmarkButton 
                  judgeId={judge.id} 
                  judgeName={judge.name}
                  className="inline-flex items-center justify-center bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                />
                <Link
                  href={`/compare?judges=${judge.id}`}
                  className="inline-flex items-center justify-center bg-white/20 backdrop-blur hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Compare
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Key Metrics Bar */}
      {(judge.total_cases > 0 || judge.reversal_rate > 0 || (judge.average_decision_time !== null && judge.average_decision_time > 0)) && (
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            {judge.total_cases > 0 && (
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {judge.total_cases.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Cases</p>
              </div>
            )}
            {judge.reversal_rate > 0 && (
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {(judge.reversal_rate * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Reversal Rate</p>
              </div>
            )}
            {judge.average_decision_time !== null && judge.average_decision_time > 0 && (
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {judge.average_decision_time}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Days to Decision</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}