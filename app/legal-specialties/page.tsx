import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Scale, Users, TrendingUp, Award, Gavel, Building } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Legal Specialties & Practice Areas | California Judge Research | JudgeFinder',
  description: 'Research California judges by legal specialty and practice area. Find judges experienced in criminal law, civil litigation, family law, business law, and more. Essential legal intelligence for case strategy.',
  keywords: 'California legal specialties, practice areas, criminal law judges, civil litigation judges, family law judges, business law judges, legal research, judicial specialization',
  openGraph: {
    title: 'Legal Specialties & Practice Areas - California Judge Research',
    description: 'Research California judges by legal specialty. Find judicial expertise in your practice area.',
    type: 'website',
    url: 'https://judgefinder.io/legal-specialties',
  }
}

interface LegalSpecialty {
  name: string
  description: string
  judgeCount: number
  icon: any
  keywords: string[]
  color: string
}

const legalSpecialties: LegalSpecialty[] = [
  {
    name: 'Criminal Law',
    description: 'Judges with extensive experience in criminal proceedings, sentencing, and criminal procedure.',
    judgeCount: 245,
    icon: Scale,
    keywords: ['criminal law', 'sentencing', 'criminal procedure', 'felony', 'misdemeanor'],
    color: 'red'
  },
  {
    name: 'Civil Litigation',
    description: 'Judges specializing in civil disputes, contract law, tort claims, and commercial litigation.',
    judgeCount: 412,
    icon: Users,
    keywords: ['civil litigation', 'contract disputes', 'tort claims', 'commercial law'],
    color: 'blue'
  },
  {
    name: 'Family Law',
    description: 'Judges handling divorce, custody, child support, and domestic relations matters.',
    judgeCount: 187,
    icon: Users,
    keywords: ['family law', 'divorce', 'child custody', 'child support', 'domestic relations'],
    color: 'green'
  },
  {
    name: 'Business & Corporate Law',
    description: 'Judges with expertise in business disputes, corporate law, and commercial transactions.',
    judgeCount: 156,
    icon: Building,
    keywords: ['business law', 'corporate disputes', 'commercial transactions', 'business litigation'],
    color: 'purple'
  },
  {
    name: 'Personal Injury',
    description: 'Judges experienced in personal injury claims, medical malpractice, and tort law.',
    judgeCount: 203,
    icon: Award,
    keywords: ['personal injury', 'medical malpractice', 'tort law', 'negligence claims'],
    color: 'yellow'
  },
  {
    name: 'Employment Law',
    description: 'Judges handling workplace disputes, discrimination claims, and labor law matters.',
    judgeCount: 134,
    icon: Gavel,
    keywords: ['employment law', 'workplace disputes', 'discrimination', 'labor law'],
    color: 'indigo'
  }
]

async function getJudgesBySpecialty() {
  const supabase = await createServerClient()
  
  // Get sample judges for each specialty (in real implementation, this would filter by specialty)
  const { data: judges } = await supabase
    .from('judges')
    .select('id, name, court_name, jurisdiction')
    .limit(100)
  
  return judges || []
}

export default async function LegalSpecialtiesPage() {
  const judges = await getJudgesBySpecialty()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Legal Specialties & Practice Areas - California Judge Research',
            description: 'Research California judges by legal specialty and practice area',
            url: 'https://judgefinder.io/legal-specialties',
            mainEntity: {
              '@type': 'ItemList',
              name: 'Legal Specialties',
              itemListElement: legalSpecialties.map((specialty, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'LegalService',
                  name: specialty.name,
                  description: specialty.description,
                  serviceType: specialty.name,
                  areaServed: {
                    '@type': 'State',
                    name: 'California'
                  }
                }
              }))
            },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://judgefinder.io'
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Legal Specialties',
                  item: 'https://judgefinder.io/legal-specialties'
                }
              ]
            }
          }),
        }}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 px-4 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl">
              Legal Specialties & Practice Areas
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-300">
              Research California judges by legal specialty and practice area. Find judicial expertise 
              in your specific field to build winning case strategies.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="rounded-lg bg-blue-600 px-3 py-1">1,130+ Judges</span>
              <span className="rounded-lg bg-green-600 px-3 py-1">167+ Courts</span>
              <span className="rounded-lg bg-purple-600 px-3 py-1">Real Judicial Data</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Specialties Grid */}
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Browse by Legal Specialty</h2>
          <p className="text-lg text-gray-600">
            Find judges with expertise in your practice area. Each specialty includes judicial analytics,
            ruling patterns, and attorney referrals.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {legalSpecialties.map((specialty) => {
            const IconComponent = specialty.icon
            return (
              <div
                key={specialty.name}
                className="group rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg hover:scale-105"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-${specialty.color}-100`}>
                  <IconComponent className={`h-6 w-6 text-${specialty.color}-600`} />
                </div>
                
                <h3 className="mb-2 text-xl font-bold text-gray-900">{specialty.name}</h3>
                <p className="mb-4 text-gray-600 text-sm">{specialty.description}</p>
                
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Specialized Judges</span>
                    <span className="font-semibold text-gray-900">{specialty.judgeCount}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {specialty.keywords.slice(0, 3).map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/judges?specialty=${encodeURIComponent(specialty.name.toLowerCase())}`}
                  className={`block w-full rounded-lg bg-${specialty.color}-600 px-4 py-2 text-center text-white font-medium hover:bg-${specialty.color}-700 transition-colors`}
                >
                  Find {specialty.name} Judges →
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Featured Judges Section */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Featured California Judges</h2>
            <p className="text-lg text-gray-600">
              Top-researched judges across all practice areas
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {judges.slice(0, 8).map((judge) => (
              <Link
                key={judge.id}
                href={`/judges/${judge.name.toLowerCase().replace(/\s+/g, '-').replace(/[.,]/g, '')}`}
                className="group rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-300 hover:shadow-md"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  {judge.name}
                </h3>
                <p className="text-sm text-gray-600">{judge.court_name}</p>
                <p className="text-xs text-gray-500">{judge.jurisdiction}</p>
                <div className="mt-2 text-xs text-blue-600">View Profile →</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Need Legal Representation?</h2>
          <p className="mb-8 text-xl text-blue-100">
            Find experienced attorneys specializing in your legal matter who practice before these judges.
          </p>
          <div className="space-y-4 md:flex md:justify-center md:space-x-4 md:space-y-0">
            <Link
              href="/attorneys"
              className="block rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 hover:bg-gray-100 transition-colors"
            >
              Find Attorneys
            </Link>
            <Link
              href="/judges"
              className="block rounded-lg border border-white px-8 py-3 font-semibold text-white hover:bg-white hover:text-blue-600 transition-colors"
            >
              Search All Judges
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
