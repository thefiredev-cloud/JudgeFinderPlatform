'use client'

import { Briefcase, GraduationCap, MapPin, Calendar, Award, Users, BookOpen } from 'lucide-react'
import type { Judge } from '@/types'

interface ProfessionalBackgroundProps {
  judge: Judge
}

export function ProfessionalBackground({ judge }: ProfessionalBackgroundProps) {
  const courtlistenerData = judge.courtlistener_data
  
  // Calculate years of service
  let appointmentDate = null
  let yearsOfService = null
  
  if (judge.appointed_date) {
    appointmentDate = new Date(judge.appointed_date)
    yearsOfService = new Date().getFullYear() - appointmentDate.getFullYear()
  } else if (courtlistenerData?.positions?.length && courtlistenerData.positions.length > 0) {
    const judicialPositions = courtlistenerData.positions
      .filter((pos: any) => pos.position_type && ['jud', 'c-jud', 'jus', 'c-jus'].includes(pos.position_type))
      .sort((a: any, b: any) => (a.date_start || '').localeCompare(b.date_start || ''))
    
    if (judicialPositions.length > 0 && judicialPositions[0].date_start) {
      appointmentDate = new Date(judicialPositions[0].date_start)
      yearsOfService = new Date().getFullYear() - appointmentDate.getFullYear()
    }
  }
  
  // Extract education data
  const education = courtlistenerData?.educations?.length && courtlistenerData.educations.length > 0 
    ? courtlistenerData.educations
        .map((edu: any) => {
          const school = edu.school?.name || edu.school_name || ''
          const degree = edu.degree || ''
          const year = edu.date_graduated ? new Date(edu.date_graduated).getFullYear() : null
          return { school, degree, year }
        })
        .filter((edu: any) => edu.school || edu.degree)
    : judge.education ? [{ school: judge.education, degree: null, year: null }] : []
  
  // Extract career history
  const careerHistory = courtlistenerData?.positions?.filter((pos: any) => 
    pos.organization_name && 
    !pos.organization_name.toLowerCase().includes('court') &&
    pos.position_type !== 'jud'
  ).slice(0, 5) || []
  
  // Generate professional bio
  let bio = judge.bio
  
  if (!bio && courtlistenerData) {
    const bioParts = []
    
    if (appointmentDate && judge.court_name) {
      bioParts.push(`Judge ${judge.name} was appointed in ${appointmentDate.getFullYear()} and serves at ${judge.court_name}.`)
    } else if (judge.court_name) {
      bioParts.push(`Judge ${judge.name} serves at ${judge.court_name}.`)
    }
    
    if (courtlistenerData.dob_city && courtlistenerData.dob_state) {
      bioParts.push(`Born in ${courtlistenerData.dob_city}, ${courtlistenerData.dob_state}.`)
    } else if (courtlistenerData.dob_state) {
      bioParts.push(`Born in ${courtlistenerData.dob_state}.`)
    }
    
    bio = bioParts.join(' ') || null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
          Professional Background
        </h2>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Bio Section */}
        {bio && (
          <div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{bio}</p>
          </div>
        )}
        
        {/* Key Information Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Court Information */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-start">
              <Award className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Current Position
                </h3>
                <p className="text-gray-900 dark:text-gray-100 font-medium">
                  {judge.court_name || 'Court not specified'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {judge.jurisdiction || 'Jurisdiction not specified'}
                </p>
                {yearsOfService !== null && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {yearsOfService} years of service
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Appointment Information */}
          {appointmentDate && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Appointment
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {appointmentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {yearsOfService} years ago
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Education Section */}
        {education.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
              <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
              Education
            </h3>
            <div className="space-y-2">
              {education.map((edu: any, index: number) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {edu.school}
                  </p>
                  {edu.degree && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {edu.degree}
                      {edu.year && ` • ${edu.year}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Career History */}
        {careerHistory.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
              Previous Experience
            </h3>
            <div className="space-y-3">
              {careerHistory.map((position: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-200 dark:border-blue-800 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {position.job_title || 'Position'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {position.organization_name}
                      </p>
                    </div>
                    {position.date_start && (
                      <span className="text-sm text-gray-500 dark:text-gray-500 ml-4">
                        {new Date(position.date_start).getFullYear()}
                        {position.date_termination && ` - ${new Date(position.date_termination).getFullYear()}`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Additional Information */}
        {courtlistenerData && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
              Additional Details
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {courtlistenerData.gender && (
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">Gender:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100 capitalize">
                    {courtlistenerData.gender}
                  </span>
                </div>
              )}
              
              {courtlistenerData.race && courtlistenerData.race.length > 0 && (
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">Ethnicity:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {courtlistenerData.race.map((r: string) => r.replace('_', ' ')).join(', ')}
                  </span>
                </div>
              )}
              
              {(courtlistenerData.dob_city || courtlistenerData.dob_state) && (
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">Birth Location:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {[courtlistenerData.dob_city, courtlistenerData.dob_state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              
              {courtlistenerData.political_affiliation?.length > 0 && (
                <div className="flex items-center text-sm">
                  <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">Affiliation:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                    {courtlistenerData.political_affiliation
                      .map((aff: any) => aff.political_party || aff)
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}