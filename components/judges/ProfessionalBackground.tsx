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
    <section className="overflow-hidden rounded-2xl border border-border bg-[hsl(var(--bg-2))] shadow-md">
      <header className="flex items-center gap-2 border-b border-border/60 bg-[hsl(var(--bg-1))] px-6 py-4">
        <Briefcase className="h-5 w-5 text-[color:hsl(var(--accent))]" aria-hidden />
        <h2 className="text-lg font-semibold text-[color:hsl(var(--text-1))]">Professional background</h2>
      </header>

      <div className="space-y-6 px-6 py-5 text-sm text-[color:hsl(var(--text-2))]">
        {bio && <p className="leading-relaxed text-[color:hsl(var(--text-2))]">{bio}</p>}

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-border/60 bg-[hsl(var(--bg-1))] p-4">
            <div className="flex items-start gap-3">
              <Award className="mt-1 h-5 w-5 text-[color:hsl(var(--accent))]" aria-hidden />
              <div className="min-w-0 space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:hsl(var(--text-3))]">
                  Current position
                </h3>
                <p className="text-base font-medium text-[color:hsl(var(--text-1))] break-words">
                  {judge.court_name || 'Court not specified'}
                </p>
                <p className="text-sm text-[color:hsl(var(--text-2))] break-words">
                  {judge.jurisdiction || 'Jurisdiction not specified'}
                </p>
                {yearsOfService !== null && (
                  <p className="text-sm text-[color:hsl(var(--text-3))]">{yearsOfService} years of service</p>
                )}
              </div>
            </div>
          </article>

          {appointmentDate && (
            <article className="rounded-xl border border-border/60 bg-[hsl(var(--bg-1))] p-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-1 h-5 w-5 text-[color:hsl(var(--accent))]" aria-hidden />
                <div className="min-w-0 space-y-1">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:hsl(var(--text-3))]">
                    Appointment
                  </h3>
                  <p className="text-base font-medium text-[color:hsl(var(--text-1))] break-words">
                    {appointmentDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-[color:hsl(var(--text-3))]">{yearsOfService} years ago</p>
                </div>
              </div>
            </article>
          )}
        </div>

        {education.length > 0 && (
          <section>
            <header className="mb-3 flex items-center gap-2 text-sm font-semibold text-[color:hsl(var(--text-1))]">
              <GraduationCap className="h-5 w-5 text-[color:hsl(var(--accent))]" aria-hidden />
              Education
            </header>
            <div className="space-y-2">
              {education.map((edu: any, index: number) => (
                <div key={`${edu.school}-${index}`} className="rounded-xl border border-border/50 bg-[hsl(var(--bg-1))] p-3">
                  <p className="font-medium text-[color:hsl(var(--text-1))] break-words">{edu.school}</p>
                  {(edu.degree || edu.year) && (
                    <p className="text-xs text-[color:hsl(var(--text-3))]">
                      {edu.degree}
                      {edu.degree && edu.year ? ' • ' : ''}
                      {edu.year ?? ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {careerHistory.length > 0 && (
          <section>
            <header className="mb-3 flex items-center gap-2 text-sm font-semibold text-[color:hsl(var(--text-1))]">
              <Briefcase className="h-5 w-5 text-[color:hsl(var(--accent))]" aria-hidden />
              Previous experience
            </header>
            <div className="space-y-3">
              {careerHistory.map((position: any, index: number) => (
                <article
                  key={`${position.organization_name || 'role'}-${index}`}
                  className="rounded-xl border border-border/40 bg-[hsl(var(--bg-1))] p-3"
                >
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-[color:hsl(var(--text-1))] break-words">
                        {position.job_title || 'Position'}
                      </p>
                      <p className="text-xs text-[color:hsl(var(--text-3))] break-words">{position.organization_name}</p>
                    </div>
                    {position.date_start && (
                      <span className="text-xs text-[color:hsl(var(--text-3))]">
                        {new Date(position.date_start).getFullYear()}
                        {position.date_termination && ` – ${new Date(position.date_termination).getFullYear()}`}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {courtlistenerData && (
          <section className="border-t border-border/60 pt-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[color:hsl(var(--text-3))]">
              Additional details
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {courtlistenerData.gender && (
                <div className="flex items-center gap-2 text-xs text-[color:hsl(var(--text-2))]">
                  <Users className="h-4 w-4 text-[color:hsl(var(--text-3))]" aria-hidden />
                  <span className="break-words capitalize">{courtlistenerData.gender}</span>
                </div>
              )}

              {courtlistenerData.race && courtlistenerData.race.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-[color:hsl(var(--text-2))]">
                  <Users className="h-4 w-4 text-[color:hsl(var(--text-3))]" aria-hidden />
                  <span className="break-words">
                    {courtlistenerData.race.map((r: string) => r.replace('_', ' ')).join(', ')}
                  </span>
                </div>
              )}

              {(courtlistenerData.dob_city || courtlistenerData.dob_state) && (
                <div className="flex items-center gap-2 text-xs text-[color:hsl(var(--text-2))]">
                  <MapPin className="h-4 w-4 text-[color:hsl(var(--text-3))]" aria-hidden />
                  <span className="break-words">
                    {[courtlistenerData.dob_city, courtlistenerData.dob_state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {courtlistenerData.political_affiliation?.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-[color:hsl(var(--text-2))]">
                  <BookOpen className="h-4 w-4 text-[color:hsl(var(--text-3))]" aria-hidden />
                  <span className="break-words">
                    {courtlistenerData.political_affiliation
                      .map((aff: any) => aff.political_party || aff)
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </section>
  )
}
