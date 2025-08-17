import { Calendar, GraduationCap, Briefcase, Award, User, Scale, Building2, MapPin, Clock } from 'lucide-react'
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
  } else if (courtlistenerData?.positions?.length > 0) {
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
  const education = courtlistenerData?.educations?.length > 0 
    ? courtlistenerData.educations
        .map((edu: any) => {
          const school = edu.school?.name || edu.school_name || ''
          const degree = edu.degree || ''
          return [school, degree].filter(Boolean).join(' - ')
        })
        .filter(Boolean)
        .join('; ')
    : judge.education || null
  
  // Create comprehensive bio from CourtListener data
  let bio = judge.bio
  
  if (!bio && courtlistenerData) {
    const bioParts = []
    
    // Add basic appointment info
    if (appointmentDate && judge.court_name) {
      bioParts.push(`Judge ${judge.name} was appointed in ${appointmentDate.getFullYear()} and serves at ${judge.court_name}.`)
    } else if (judge.court_name) {
      bioParts.push(`Judge ${judge.name} serves at ${judge.court_name}.`)
    }
    
    // Add birth/background info if available
    if (courtlistenerData.dob_city && courtlistenerData.dob_state) {
      bioParts.push(`Born in ${courtlistenerData.dob_city}, ${courtlistenerData.dob_state}.`)
    } else if (courtlistenerData.dob_state) {
      bioParts.push(`Born in ${courtlistenerData.dob_state}.`)
    }
    
    // Add notable career positions
    if (courtlistenerData.positions?.length > 1) {
      const notablePositions = courtlistenerData.positions
        .filter((pos: any) => pos.organization_name && !pos.organization_name.includes('Court'))
        .slice(0, 2)
      
      if (notablePositions.length > 0) {
        const positionText = notablePositions
          .map((pos: any) => pos.organization_name)
          .join(' and ')
        bioParts.push(`Previously served with ${positionText}.`)
      }
    }
    
    bio = bioParts.join(' ') || null
  }
  
  // Extract additional professional details
  const professionalBackground = courtlistenerData?.positions?.filter((pos: any) => 
    pos.organization_name && 
    !pos.organization_name.toLowerCase().includes('court') &&
    pos.position_type !== 'jud'
  ).slice(0, 3) || []
  
  return (
    <div className="rounded-lg bg-white shadow-md overflow-hidden">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{judge.name}</h2>
              <div className="flex items-center mt-1 text-sm text-blue-200">
                <MapPin className="h-4 w-4 mr-1" />
                {getCourtAndStateDisplay()}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-200">Years of Service</p>
            <p className="text-3xl font-bold">
              {yearsOfService !== null ? yearsOfService : '—'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Bio Section */}
        {bio && (
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900 flex items-center">
              <Scale className="h-5 w-5 mr-2 text-blue-600" />
              About Judge {judge.name.split(' ').pop()}
            </h3>
            <p className="text-gray-700 leading-relaxed">{bio}</p>
          </div>
        )}

        {/* Key Information Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {appointmentDate && (
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50">
              <Calendar className="h-5 w-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Judicial Appointment</p>
                <p className="text-sm text-gray-600">
                  {appointmentDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          {education && (
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50">
              <GraduationCap className="h-5 w-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Education</p>
                <p className="text-sm text-gray-600">{education}</p>
              </div>
            </div>
          )}

          <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50">
            <Building2 className="h-5 w-5 text-blue-600 mt-1" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Court Type</p>
              <p className="text-sm text-gray-600 capitalize">
                {judge.court_name?.includes('Superior') ? 'State Trial Court' : 
                 judge.court_name?.includes('Appeal') ? 'Appellate Court' : 
                 judge.court_name?.includes('Federal') ? 'Federal Court' :
                 'Local Court'}
              </p>
            </div>
          </div>

          {/* Additional demographic info from CourtListener */}
          {courtlistenerData?.gender && (
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50">
              <User className="h-5 w-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Demographics</p>
                <p className="text-sm text-gray-600 capitalize">
                  {courtlistenerData.gender}
                  {courtlistenerData.race && `, ${courtlistenerData.race.map((r: string) => r.replace('_', ' ')).join(', ')}`}
                </p>
              </div>
            </div>
          )}

          {/* Party affiliation if available */}
          {courtlistenerData?.political_affiliation?.length > 0 && (
            <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50">
              <Scale className="h-5 w-5 text-blue-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Political Affiliation</p>
                <p className="text-sm text-gray-600">
                  {courtlistenerData.political_affiliation
                    .map((aff: any) => aff.political_party || aff)
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Professional Background Section */}
        {professionalBackground.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
              Professional Background
            </h3>
            <div className="space-y-3">
              {professionalBackground.map((position: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {position.job_title || 'Position'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {position.organization_name}
                      {position.date_start && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({new Date(position.date_start).getFullYear()}
                          {position.date_termination && ` - ${new Date(position.date_termination).getFullYear()}`})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real Data Only - No Fake Metrics */}
        {(judge.total_cases > 0 || judge.reversal_rate > 0 || judge.average_decision_time > 0) && (
          <div className="border-t pt-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 flex items-center">
              <Award className="h-5 w-5 mr-2 text-blue-600" />
              Judicial Performance Metrics
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {judge.total_cases > 0 && (
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-center">
                  <Briefcase className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">
                    {judge.total_cases.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">Cases Handled</p>
                </div>
              )}
              {judge.reversal_rate > 0 && (
                <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4 text-center">
                  <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">
                    {(judge.reversal_rate * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Reversal Rate</p>
                </div>
              )}
              {judge.average_decision_time > 0 && (
                <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4 text-center">
                  <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">
                    {judge.average_decision_time}
                  </p>
                  <p className="text-sm text-gray-600">Avg. Days to Decision</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CourtListener Data Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Real Judicial Data:</strong> This profile uses verified information from CourtListener and official court records. 
            {courtlistenerData ? 'Comprehensive CourtListener data available.' : 'Enhanced with appointment and court information.'} 
            Our analytics below provide AI-powered insights into judicial decision patterns.
          </p>
        </div>
      </div>
    </div>
  )
}