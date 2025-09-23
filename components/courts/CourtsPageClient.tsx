'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Building, Gavel, Users, MapPin, ChevronRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { CourtsSearch } from './CourtsSearch'
import { CountiesTab } from './CountiesTab'

interface Court {
  id: string
  name: string
  type: string
  jurisdiction: string
  slug?: string
  address?: string | number
  phone?: string
  website?: string
  judge_count: number
}

// Animated counter component
function AnimatedCounter({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration])
  
  return <span>{count.toLocaleString()}</span>
}

// Typewriter effect component
function TypewriterText({ text, delay = 50 }: { text: string; delay?: number }) {
  const [displayText, setDisplayText] = useState('')
  
  useEffect(() => {
    setDisplayText('')
    
    if (!text) return
    
    let index = 0
    const timer = setInterval(() => {
      if (index < text.length) {
        const char = text.charAt(index)
        setDisplayText(prev => prev + char)
        index++
      } else {
        clearInterval(timer)
      }
    }, delay)
    
    return () => {
      clearInterval(timer)
    }
  }, [text, delay])
  
  return <span>{displayText}</span>
}

// Particle background component
function ParticleBackground() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 bg-enterprise-primary/20 rounded-full"
          initial={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
            y: Math.random() * 400
          }}
          animate={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
            y: Math.random() * 400,
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  )
}

export function CourtsPageClient({ initialCourts, initialJurisdiction = 'CA' }: { initialCourts: Court[], initialJurisdiction?: string }) {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -50])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3])
  
  const [stats, setStats] = useState([
    { icon: Building, value: 0, label: "Total Courts", color: "text-primary", suffix: "", isText: true, text: '—' },
    { icon: Gavel, value: 0, label: "Court Types", color: "text-enterprise-accent", isText: true, text: 'Loading...', suffix: "" },
    { icon: MapPin, value: 0, label: "Counties Covered", color: "text-enterprise-deep", isText: true, text: '—', suffix: "" },
    { icon: Users, value: 0, label: "Avg Judges per Court", color: "text-enterprise-light", isText: true, text: '—', suffix: "" }
  ])

  // Fetch court-specific stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats/courts')
        if (response.ok) {
          const data = await response.json()
          setStats([
            {
              icon: Building,
              value: typeof data.totalCourts === 'number' ? data.totalCourts : 0,
              label: "Total Courts",
              color: "text-primary",
              suffix: "",
              isText: typeof data.totalCourts === 'number' ? false : true,
              text: typeof data.totalCourts === 'number' ? undefined : '—'
            },
            {
              icon: Gavel,
              value: 0,
              label: "Court Types",
              color: "text-enterprise-accent",
              isText: true,
              text: typeof data.courtTypeDisplay === 'string' ? data.courtTypeDisplay : '—',
              suffix: ""
            },
            {
              icon: MapPin,
              value: typeof data.countiesCovered === 'number' ? data.countiesCovered : 0,
              label: "Counties Covered",
              color: "text-enterprise-deep",
              suffix: "",
              isText: typeof data.countiesCovered === 'number' ? false : true,
              text: typeof data.countiesCovered === 'number' ? data.countiesCovered.toString() : (data.countiesDisplay || '—')
            },
            {
              icon: Users,
              value: typeof data.avgJudgesPerCourt === 'number' ? data.avgJudgesPerCourt : 0,
              label: "Avg Judges per Court",
              color: "text-enterprise-light",
              suffix: "",
              isText: typeof data.avgJudgesPerCourt === 'number' ? false : true,
              text: typeof data.avgJudgesPerCourt === 'number' ? undefined : '—'
            }
          ])
        }
      } catch (error) {
        console.error('Failed to fetch court stats:', error)
      }
    }
    fetchStats()
  }, [])

  const [activeTab, setActiveTab] = useState<'courts' | 'counties'>('courts')

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Enhanced Hero Section with Animations */}
      <section className="relative min-h-[60vh] flex items-center justify-center">
        <ParticleBackground />
        
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
            <span className="text-foreground font-medium">Courts</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-6 text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-enterprise-primary to-enterprise-deep bg-clip-text text-transparent">
                Courts
              </span>
              <br />
              <span className="text-foreground">
                <TypewriterText text="Directory" />
              </span>
            </h1>
          </motion.div>
          
          <motion.p 
            className="mx-auto mb-12 max-w-2xl text-lg md:text-xl text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Browse courts across jurisdictions. Search by type, jurisdiction, and location
            to find court information and assigned judges.
          </motion.p>
          
          {/* Animated Statistics */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            {stats.map((stat, index) => (
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
                    {stat.isText ? (
                      <span className="text-lg">{stat.text ?? '—'}</span>
                    ) : (
                      <>
                        <AnimatedCounter end={stat.value} />
                        {stat.suffix}
                      </>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-primary rounded-full mt-2" />
          </div>
        </motion.div>
      </section>

      {/* Main Content with Animation */}
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
              <span className="text-sm font-medium">Comprehensive Court Database</span>
            </div>
          </motion.div>
          
          {/* Tabs */}
          <div className="mb-6 flex items-center gap-2">
            <button
              onClick={() => setActiveTab('courts')}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                activeTab === 'courts'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-foreground hover:bg-accent/5'
              }`}
            >
              Courts
            </button>
            <button
              onClick={() => setActiveTab('counties')}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                activeTab === 'counties'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-foreground hover:bg-accent/5'
              }`}
            >
              Counties
            </button>
          </div>

          {activeTab === 'courts' ? (
            <CourtsSearch initialCourts={initialCourts} initialJurisdiction={initialJurisdiction} />
          ) : (
            <CountiesTab />
          )}
        </div>
      </motion.section>
    </div>
  )
}
