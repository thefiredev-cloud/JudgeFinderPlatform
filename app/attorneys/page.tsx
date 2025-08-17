import { Scale, MapPin, Star, Building, Phone, Mail, Globe, Users } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find Local Attorneys | California Legal Directory | JudgeFinder',
  description: 'Find experienced attorneys in your jurisdiction. Connect with local legal professionals who understand your courts and judges.',
  keywords: 'attorneys, lawyers, legal professionals, California lawyers, local attorneys, legal directory, find lawyer',
  openGraph: {
    title: 'Find Local Attorneys - California Legal Directory',
    description: 'Connect with experienced attorneys who practice in your jurisdiction.',
    type: 'website',
    url: 'https://judgefinder.io/attorneys',
  }
}

interface Attorney {
  id: string
  name: string
  firm: string
  specialties: string[]
  jurisdiction: string
  experience: number
  rating: number
  verified: boolean
  contact: {
    phone?: string
    email?: string
    website?: string
  }
  description: string
  image?: string
}

// Sample attorney data - in production this would come from database
const featuredAttorneys: Attorney[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    firm: 'Chen & Associates',
    specialties: ['Civil Litigation', 'Personal Injury', 'Employment Law'],
    jurisdiction: 'Orange County',
    experience: 12,
    rating: 4.9,
    verified: true,
    contact: {
      phone: '(714) 555-0123',
      email: 'sarah@chenlaw.com',
      website: 'https://chenlaw.com'
    },
    description: 'Experienced litigator with extensive knowledge of Orange County courts and judges.',
    image: '/attorneys/sarah-chen.jpg'
  },
  {
    id: '2',
    name: 'Michael Rodriguez',
    firm: 'Rodriguez Legal Group',
    specialties: ['Criminal Defense', 'DUI', 'Domestic Violence'],
    jurisdiction: 'Los Angeles County',
    experience: 15,
    rating: 4.8,
    verified: true,
    contact: {
      phone: '(213) 555-0456',
      email: 'michael@rodriguezlegal.com',
      website: 'https://rodriguezlegal.com'
    },
    description: 'Former prosecutor with deep understanding of LA County judicial preferences.',
    image: '/attorneys/michael-rodriguez.jpg'
  },
  {
    id: '3',
    name: 'Jennifer Thompson',
    firm: 'Thompson Family Law',
    specialties: ['Family Law', 'Divorce', 'Child Custody'],
    jurisdiction: 'San Diego County',
    experience: 18,
    rating: 4.9,
    verified: true,
    contact: {
      phone: '(619) 555-0789',
      email: 'jennifer@thompsonfamilylaw.com',
      website: 'https://thompsonfamilylaw.com'
    },
    description: 'Specializing in family matters with comprehensive knowledge of San Diego family courts.',
    image: '/attorneys/jennifer-thompson.jpg'
  }
]

const jurisdictions = [
  'Los Angeles County',
  'Orange County', 
  'San Diego County',
  'San Francisco County',
  'Santa Clara County',
  'Alameda County',
  'Sacramento County',
  'Riverside County'
]

const practiceAreas = [
  'Civil Litigation',
  'Criminal Defense',
  'Family Law',
  'Personal Injury',
  'Employment Law',
  'Business Law',
  'Real Estate',
  'Immigration',
  'Estate Planning',
  'Bankruptcy'
]

export default function AttorneysPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-900 to-blue-800 px-4 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl">
              Find Experienced Local Attorneys
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-blue-100">
              Connect with legal professionals who understand your jurisdiction's courts, 
              judges, and local legal procedures.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="rounded-lg bg-blue-700 px-3 py-1">Verified Attorneys</span>
              <span className="rounded-lg bg-green-600 px-3 py-1">Local Expertise</span>
              <span className="rounded-lg bg-purple-600 px-3 py-1">Court Knowledge</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Attorneys
              </label>
              <input
                type="text"
                placeholder="Attorney name or firm..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jurisdiction
              </label>
              <select className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="">All Jurisdictions</option>
                {jurisdictions.map((jurisdiction) => (
                  <option key={jurisdiction} value={jurisdiction}>
                    {jurisdiction}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Practice Area
              </label>
              <select className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="">All Practice Areas</option>
                {practiceAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Attorneys */}
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-12">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Featured Attorneys</h2>
          <p className="text-lg text-gray-600">
            Experienced legal professionals with proven track records in their jurisdictions
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featuredAttorneys.map((attorney) => (
            <div
              key={attorney.id}
              className="group rounded-lg bg-white p-6 shadow-md transition-all hover:shadow-lg hover:scale-105"
            >
              {/* Attorney Header */}
              <div className="mb-4 flex items-start">
                <div className="mr-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Scale className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-900">{attorney.name}</h3>
                    {attorney.verified && (
                      <div className="rounded-full bg-green-100 p-1">
                        <Users className="h-3 w-3 text-green-600" />
                      </div>
                    )}
                  </div>
                  <p className="text-blue-600 font-medium">{attorney.firm}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(attorney.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">({attorney.rating})</span>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {attorney.specialties.slice(0, 3).map((specialty) => (
                    <span
                      key={specialty}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Location and Experience */}
              <div className="mb-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  {attorney.jurisdiction}
                </div>
                <div className="flex items-center">
                  <Building className="mr-2 h-4 w-4" />
                  {attorney.experience} years experience
                </div>
              </div>

              {/* Description */}
              <p className="mb-4 text-sm text-gray-600">
                {attorney.description}
              </p>

              {/* Contact Options */}
              <div className="space-y-2">
                {attorney.contact.phone && (
                  <a
                    href={`tel:${attorney.contact.phone}`}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    {attorney.contact.phone}
                  </a>
                )}
                {attorney.contact.email && (
                  <a
                    href={`mailto:${attorney.contact.email}`}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Contact via email
                  </a>
                )}
                {attorney.contact.website && (
                  <a
                    href={attorney.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Visit website
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Are You an Attorney?</h2>
          <p className="mb-8 text-xl text-blue-100">
            Join our directory and connect with clients who are researching judges in your practice area.
          </p>
          <div className="space-y-4 md:flex md:justify-center md:space-x-4 md:space-y-0">
            <Link
              href="/signup?type=attorney"
              className="block rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 hover:bg-gray-100 transition-colors"
            >
              Join Attorney Directory
            </Link>
            <Link
              href="/about"
              className="block rounded-lg border border-white px-8 py-3 font-semibold text-white hover:bg-white hover:text-blue-600 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}