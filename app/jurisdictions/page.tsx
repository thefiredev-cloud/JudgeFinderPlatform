'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Building, Users, Scale, TrendingUp, ArrowRight, ChevronRight, Globe, Shield, Sparkles } from 'lucide-react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { ParticleBackground } from '@/components/ui/ParticleBackground'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { TypewriterText } from '@/components/ui/TypewriterText'
import { ScrollIndicator } from '@/components/ui/ScrollIndicator'

interface Jurisdiction {
  name: string
  type: 'county' | 'district' | 'region'
  judgeCount: number
  courtCount: number
  population: number
  majorCities: string[]
  description: string
  slug: string
}

const majorJurisdictions: Jurisdiction[] = [
  {
    name: 'Los Angeles County',
    type: 'county',
    judgeCount: 347,
    courtCount: 38,
    population: 10000000,
    majorCities: ['Los Angeles', 'Long Beach', 'Pasadena', 'Burbank', 'Glendale'],
    description: 'Largest judicial system in California with comprehensive trial and appellate courts.',
    slug: 'los-angeles-county'
  },
  {
    name: 'Orange County',
    type: 'county',
    judgeCount: 89,
    courtCount: 12,
    population: 3175000,
    majorCities: ['Anaheim', 'Santa Ana', 'Irvine', 'Huntington Beach', 'Garden Grove'],
    description: 'Major Southern California jurisdiction serving diverse communities and businesses.',
    slug: 'orange-county'
  },
  {
    name: 'San Diego County',
    type: 'county',
    judgeCount: 112,
    courtCount: 15,
    population: 3338000,
    majorCities: ['San Diego', 'Chula Vista', 'Oceanside', 'Escondido', 'Carlsbad'],
    description: 'Southern California coastal jurisdiction with federal and state court systems.',
    slug: 'san-diego-county'
  },
  {
    name: 'San Francisco County',
    type: 'county',
    judgeCount: 67,
    courtCount: 8,
    population: 875000,
    majorCities: ['San Francisco'],
    description: 'Metropolitan jurisdiction with specialized business and technology courts.',
    slug: 'san-francisco-county'
  },
  {
    name: 'Santa Clara County',
    type: 'county',
    judgeCount: 78,
    courtCount: 11,
    population: 1936000,
    majorCities: ['San Jose', 'Sunnyvale', 'Santa Clara', 'Mountain View', 'Palo Alto'],
    description: 'Silicon Valley jurisdiction handling technology and intellectual property cases.',
    slug: 'santa-clara-county'
  },
  {
    name: 'Alameda County',
    type: 'county',
    judgeCount: 92,
    courtCount: 13,
    population: 1670000,
    majorCities: ['Oakland', 'Fremont', 'Berkeley', 'Hayward', 'San Leandro'],
    description: 'Bay Area jurisdiction with diverse civil and criminal caseloads.',
    slug: 'alameda-county'
  }
]

// Function to convert jurisdiction name to URL slug
function createSlugFromJurisdiction(jurisdiction: string): string {
  return jurisdiction
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
}

export default function JurisdictionsPage() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -50])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3])
  
  const [jurisdictionStats, setJurisdictionStats] = useState<Record<string, number>>({})
  const [courts, setCourts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3 }
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch jurisdiction stats
        const judgesResponse = await fetch('/api/judges/list?limit=1000')
        if (judgesResponse.ok) {
          const judgesData = await judgesResponse.json()
          const stats: Record<string, number> = {}
          judgesData.judges?.forEach((judge: any) => {
            const jurisdiction = judge.jurisdiction
            if (jurisdiction) {
              stats[jurisdiction] = (stats[jurisdiction] || 0) + 1
            }
          })
          setJurisdictionStats(stats)
        }

        // Fetch courts
        const courtsResponse = await fetch('/api/courts?limit=50')
        if (courtsResponse.ok) {
          const courtsData = await courtsResponse.json()
          setCourts(courtsData.courts || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Enhanced Hero Section with Animations */}
      <section className="relative min-h-[60vh] flex items-center justify-center">
        <ParticleBackground particleCount={30} />
        
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-enterprise-primary/10 via-enterprise-deep/10 to-background" />

        <motion.div 
          className="relative z-10 text-center px-4 max-w-7xl mx-auto w-full"
          style={{ y, opacity }}
        >
          {/* Breadcrumb */}
          <motion.div 
            className="mb-6 flex items-center justify-center gap-2 text-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">Jurisdictions</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-6 text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-enterprise-primary to-enterprise-deep bg-clip-text text-transparent">
                California Court
              </span>
              <br />
              <span className="text-foreground">
                <TypewriterText text="Jurisdictions" />
              </span>
            </h1>
          </motion.div>
          
          <motion.p 
            className="mx-auto mb-12 max-w-2xl text-lg md:text-xl text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Find courts and judges in your California jurisdiction. Complete directory of county courts,
            judicial districts, and local legal services across all 58 counties.
          </motion.p>
          
          {/* Animated Statistics */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            {[
              { icon: MapPin, value: 58, label: "Counties", color: "text-primary" },
              { icon: Building, value: 167, label: "Courts", color: "text-enterprise-accent" },
              { icon: Scale, value: 1810, label: "Judges", color: "text-enterprise-deep" },
              { icon: Users, value: 40, label: "Million Residents", suffix: "M", color: "text-enterprise-light" }
            ].map((stat, index) => (
              <motion.div 
                key={stat.label}
                className="group"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:bg-accent/5 transition-all duration-300">
                  <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                  <div className={`text-3xl font-bold ${stat.color}`}>
                    <AnimatedCounter end={stat.value} />
                    {stat.suffix}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
        
        <ScrollIndicator />
      </section>

      {/* Major Jurisdictions */}
      <motion.section 
        className="px-4 py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Major Court Jurisdictions</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold bg-gradient-to-r from-enterprise-primary to-enterprise-deep bg-clip-text text-transparent">
              Major California Jurisdictions
            </h2>
            <p className="text-lg text-muted-foreground">
              Browse the largest court jurisdictions in California. Find judges, court locations,
              and legal services in major metropolitan areas.
            </p>
          </motion.div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {majorJurisdictions.map((jurisdiction, index) => (
            <motion.div
              key={jurisdiction.name}
              variants={cardVariants}
              whileHover={{ 
                scale: 1.03,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
              className="group relative rounded-2xl bg-white p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-300 overflow-hidden"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative">
                <div className="mb-4 flex items-center">
                  <motion.div 
                    className="mr-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-enterprise-primary to-enterprise-deep"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <MapPin className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {jurisdiction.name}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">{jurisdiction.type}</p>
                  </div>
                </div>
                
                <p className="mb-4 text-gray-600 text-sm">{jurisdiction.description}</p>
                
                <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"
                  >
                    <motion.div 
                      className="font-bold text-2xl text-blue-600"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      {jurisdiction.judgeCount}
                    </motion.div>
                    <div className="text-gray-600">Judges</div>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg"
                  >
                    <motion.div 
                      className="font-bold text-2xl text-green-600"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      {jurisdiction.courtCount}
                    </motion.div>
                    <div className="text-gray-600">Courts</div>
                  </motion.div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2">Major Cities:</div>
                  <div className="flex flex-wrap gap-2">
                    {jurisdiction.majorCities.slice(0, 3).map((city, cityIndex) => (
                      <motion.span
                        key={city}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 + index * 0.1 + cityIndex * 0.05 }}
                        className="rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-1 text-xs text-gray-700"
                      >
                        {city}
                      </motion.span>
                    ))}
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href={`/jurisdictions/${jurisdiction.slug}`}
                    className="flex items-center justify-center w-full rounded-lg bg-gradient-to-r from-enterprise-primary to-enterprise-deep px-4 py-3 text-center text-white font-medium hover:from-enterprise-accent hover:to-enterprise-primary transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    View Courts & Judges
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        </div>
      </motion.section>

      {/* All California Counties */}
      <motion.section 
        className="bg-muted/30 py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="mb-4 text-3xl font-bold bg-gradient-to-r from-enterprise-primary to-enterprise-deep bg-clip-text text-transparent">
              All California Counties
            </h2>
            <p className="text-lg text-gray-600">
              Complete directory of all 58 California counties and their court systems
            </p>
          </motion.div>

          <AnimatePresence>
            {!loading && (
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {Object.entries(jurisdictionStats).map(([jurisdiction, count], index) => (
                  <motion.div
                    key={jurisdiction}
                    variants={cardVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={`/jurisdictions/${createSlugFromJurisdiction(jurisdiction)}`}
                      className="group block rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-400 hover:shadow-lg bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {jurisdiction}
                          </h3>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium text-blue-600">{count}</span> judges
                          </p>
                        </div>
                        <motion.div
                          whileHover={{ rotate: 20 }}
                          transition={{ type: "spring" }}
                        >
                          <MapPin className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </motion.div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* Court Directory */}
      <motion.section 
        className="py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="mx-auto max-w-7xl px-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-12"
          >
            <h2 className="mb-4 text-3xl font-bold bg-gradient-to-r from-enterprise-primary to-enterprise-deep bg-clip-text text-transparent">
              Recent Court Additions
            </h2>
            <p className="text-lg text-gray-600">
              Newly added courts to our directory
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {courts.slice(0, 6).map((court, index) => (
              <motion.div
                key={court.id}
                variants={cardVariants}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={`/courts/${court.name?.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group block rounded-xl bg-white p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-300"
                >
                  <div className="mb-4 flex items-start">
                    <motion.div
                      whileHover={{ rotate: 15 }}
                      transition={{ type: "spring" }}
                      className="mr-3"
                    >
                      <Building className="h-6 w-6 text-blue-600" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {court.name}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">{court.type} Court</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                      {court.jurisdiction}
                    </div>
                    {court.address && (
                      <div className="text-xs text-gray-500 truncate">
                        {court.address}
                      </div>
                    )}
                  </div>
                  
                  <motion.div 
                    className="mt-4 flex items-center text-sm text-blue-600 font-medium"
                    whileHover={{ x: 5 }}
                  >
                    View Court Details
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Legal Services CTA */}
      <section className="border-t border-border bg-gradient-to-r from-enterprise-primary/10 to-enterprise-deep/10 px-4 py-20">

        <motion.div 
          className="mx-auto max-w-4xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="mb-4 text-3xl md:text-4xl font-bold">
            Need Legal Help in Your Area?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Find experienced local attorneys who practice in your jurisdiction and understand local court procedures.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                href="/attorneys" 
                className="inline-block rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 text-center"
              >
                Find Local Attorneys
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                href="/courts" 
                className="inline-block rounded-lg border border-border px-8 py-3 font-semibold text-foreground transition hover:bg-muted text-center bg-card"
              >
                Browse All Courts
              </Link>
            </motion.div>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            <Sparkles className="inline-block w-4 h-4 mr-1" />
            Free access to comprehensive court information across California
          </p>
        </motion.div>
      </section>
    </div>
  )
}