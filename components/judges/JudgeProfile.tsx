'use client'

import { Calendar, GraduationCap, Briefcase, Award, User, Scale, Building2, MapPin, Clock, Users, ChevronRight, BarChart3 } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import type { Judge } from '@/types'

interface JudgeProfileProps {
  judge: Judge
}

export function JudgeProfile({ judge }: JudgeProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'experience' | 'attorneys'>('overview')

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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'experience', label: 'Court Experience', icon: Scale },
    { id: 'attorneys', label: 'Find Attorneys', icon: Users },
  ] as const

  return (
    <div className="rounded-xl bg-white shadow-lg overflow-hidden">
      {/* Enhanced Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-4 ring-white/30">
                <User className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{judge.name}</h1>
                <div className="flex items-center text-blue-200 text-lg">
                  <MapPin className="h-5 w-5 mr-2" />
                  {getCourtAndStateDisplay()}
                </div>
                {appointmentDate && (
                  <div className="flex items-center text-blue-200 text-sm mt-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Appointed {appointmentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="mb-4">
                <Link
                  href={`/compare?judges=${judge.id}`}
                  className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Compare Judge</span>
                </Link>
              </div>
              <p className="text-blue-200 text-sm font-medium">Years of Service</p>
              <p className="text-4xl font-bold">
                {yearsOfService !== null ? yearsOfService : '—'}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-md font-medium transition-all duration-200 flex-1 justify-center ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-700 shadow-md'
                      : 'text-blue-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:block">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="p-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* About Section */}
            {bio && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Scale className="h-5 w-5 mr-2 text-blue-600" />
                  About Judge {judge.name.split(' ').pop()}
                </h3>
                <p className="text-gray-700 leading-relaxed text-lg">{bio}</p>
              </div>
            )}

            {/* Key Information Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {appointmentDate && (
                <div className="flex items-start space-x-4 p-6 rounded-lg bg-gray-50 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Judicial Appointment</p>
                    <p className="text-lg font-medium text-gray-700 mt-1">
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
                <div className="flex items-start space-x-4 p-6 rounded-lg bg-gray-50 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Education</p>
                    <p className="text-lg font-medium text-gray-700 mt-1">{education}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-4 p-6 rounded-lg bg-gray-50 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Court Type</p>
                  <p className="text-lg font-medium text-gray-700 mt-1 capitalize">
                    {judge.court_name?.includes('Superior') ? 'State Trial Court' : 
                     judge.court_name?.includes('Appeal') ? 'Appellate Court' : 
                     judge.court_name?.includes('Federal') ? 'Federal Court' :
                     'Local Court'}
                  </p>
                </div>
              </div>

              {/* Additional demographic info from CourtListener */}
              {courtlistenerData?.gender && (
                <div className="flex items-start space-x-4 p-6 rounded-lg bg-gray-50 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Demographics</p>
                    <p className="text-lg font-medium text-gray-700 mt-1 capitalize">
                      {courtlistenerData.gender}
                      {courtlistenerData.race && `, ${courtlistenerData.race.map((r: string) => r.replace('_', ' ')).join(', ')}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-8">
            {/* Professional Background Section */}
            {professionalBackground.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Briefcase className="h-6 w-6 mr-3 text-blue-600" />
                  Professional Background
                </h3>
                <div className="space-y-4">
                  {professionalBackground.map((position: any, index: number) => (
                    <div key={index} className="flex items-start space-x-4 p-6 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 hover:shadow-md transition-all">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-gray-900">
                          {position.job_title || 'Position'}
                        </p>
                        <p className="text-gray-600 font-medium">
                          {position.organization_name}
                        </p>
                        {position.date_start && (
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(position.date_start).getFullYear()}
                            {position.date_termination && ` - ${new Date(position.date_termination).getFullYear()}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Judicial Performance Metrics */}
            {(judge.total_cases > 0 || judge.reversal_rate > 0 || (judge.average_decision_time !== null && judge.average_decision_time > 0)) && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Award className="h-6 w-6 mr-3 text-blue-600" />
                  Judicial Performance Metrics
                </h3>
                <div className="grid gap-6 sm:grid-cols-3">
                  {judge.total_cases > 0 && (
                    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 text-center border border-blue-200 hover:shadow-lg transition-shadow">
                      <Briefcase className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                      <p className="text-3xl font-bold text-gray-900">
                        {judge.total_cases.toLocaleString()}
                      </p>
                      <p className="text-sm font-medium text-gray-600 mt-1">Cases Handled</p>
                    </div>
                  )}
                  {judge.reversal_rate > 0 && (
                    <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-6 text-center border border-green-200 hover:shadow-lg transition-shadow">
                      <Award className="h-10 w-10 text-green-600 mx-auto mb-3" />
                      <p className="text-3xl font-bold text-gray-900">
                        {(judge.reversal_rate * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm font-medium text-gray-600 mt-1">Reversal Rate</p>
                    </div>
                  )}
                  {judge.average_decision_time !== null && judge.average_decision_time > 0 && (
                    <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 text-center border border-purple-200 hover:shadow-lg transition-shadow">
                      <Clock className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                      <p className="text-3xl font-bold text-gray-900">
                        {judge.average_decision_time}
                      </p>
                      <p className="text-sm font-medium text-gray-600 mt-1">Avg. Days to Decision</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Party affiliation if available */}
            {courtlistenerData?.political_affiliation?.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Scale className="h-5 w-5 mr-2 text-amber-600" />
                  Political Affiliation
                </h3>
                <p className="text-gray-700">
                  {courtlistenerData?.political_affiliation
                    ?.map((aff: any) => aff.political_party || aff)
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attorneys' && (
          <div className="space-y-8">
            {/* Attorney Directory CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center">
              <div className="max-w-2xl mx-auto">
                <Users className="h-16 w-16 mx-auto mb-4 text-white" />
                <h3 className="text-2xl font-bold mb-4">
                  Find Qualified Attorneys
                </h3>
                <p className="text-blue-100 text-lg mb-6">
                  Connect with experienced legal professionals who have appeared before Judge {judge.name.split(' ').pop()} 
                  at {judge.court_name} in {judge.jurisdiction}.
                </p>
                <a 
                  href="#attorney-slots" 
                  className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg text-lg"
                >
                  View Attorney Directory
                  <ChevronRight className="h-5 w-5 ml-2" />
                </a>
              </div>
            </div>

            {/* Attorney Benefits */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Court Experience</h4>
                    <p className="text-gray-600">Attorneys with proven track records appearing before this specific judge and court.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Scale className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Local Knowledge</h4>
                    <p className="text-gray-600">Deep understanding of local court procedures and judicial preferences in {judge.jurisdiction}.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Specialized Practice</h4>
                    <p className="text-gray-600">Attorneys specializing in civil, criminal, family law, and other practice areas.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Briefcase className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Case Strategy</h4>
                    <p className="text-gray-600">Strategic insights for effective case preparation and courtroom success.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Source Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-blue-800">
            <strong>Verified Judicial Data:</strong> This profile uses verified information from CourtListener and official court records. 
            {courtlistenerData ? 'Comprehensive CourtListener data available.' : 'Enhanced with appointment and court information.'} 
            Our analytics provide AI-powered insights into judicial decision patterns for legal research and case strategy.
          </p>
        </div>
      </div>
    </div>
  )
}