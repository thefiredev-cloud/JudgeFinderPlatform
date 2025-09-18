'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { 
  Scale, Shield, Clock, Search, Users, TrendingUp,
  FileText, Award, CheckCircle, AlertCircle, BarChart3,
  Gavel, BookOpen, Heart, Target, Eye, Sparkles
} from 'lucide-react'

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
    // Reset display text when text prop changes
    setDisplayText('')
    
    if (!text) return // Guard against undefined text
    
    let index = 0
    const timer = setInterval(() => {
      if (index < text.length) {
        // Use charAt to safely get character at index
        const char = text.charAt(index)
        setDisplayText(prev => prev + char)
        index++
      } else {
        clearInterval(timer)
      }
    }, delay)
    
    // Cleanup function
    return () => {
      clearInterval(timer)
    }
  }, [text, delay])
  
  return <span>{displayText}</span>
}

// Particle background component
function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 bg-enterprise-primary/20 rounded-full"
          initial={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)
          }}
          animate={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
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

export default function AboutPage() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -50])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3])
  
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  
  // State for platform impact stats
  const [platformStats, setPlatformStats] = useState({
    monthlySearches: "50K+",
    yearsOfData: 3,
    availability: "24/7",
    dataBreaches: 0
  })
  
  // Fetch platform impact stats
  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        const response = await fetch('/api/stats/platform')
        if (response.ok) {
          const data = await response.json()
          setPlatformStats({
            monthlySearches: data.monthlySearches,
            yearsOfData: data.yearsOfData,
            availability: data.availability,
            dataBreaches: data.dataBreaches
          })
        }
      } catch (error) {
        console.error('Failed to fetch platform stats:', error)
      }
    }
    fetchPlatformStats()
  }, [])

  const benefits = [
    { 
      icon: Search, 
      title: "Find Your Judge Instantly", 
      desc: "Search any California judge by name, court, or jurisdiction to access their complete professional profile" 
    },
    { 
      icon: BarChart3, 
      title: "Understand Judicial Patterns", 
      desc: "View clear analytics on case outcomes, decision timing, and ruling trends - no legal degree required" 
    },
    { 
      icon: Shield, 
      title: "Your Information is Private", 
      desc: "We respect your privacy. We collect limited usage metrics and search queries to improve the service. See our Privacy Policy." 
    },
    { 
      icon: Clock, 
      title: "Save Research Time", 
      desc: "Get comprehensive judge information in seconds instead of hours of manual research" 
    },
    { 
      icon: FileText, 
      title: "Access Real Court Data", 
      desc: "All information comes directly from official court records and public judicial databases" 
    },
    { 
      icon: Heart, 
      title: "Always Free to Use", 
      desc: "No subscriptions, no hidden fees. Equal access to justice information for everyone" 
    }
  ]

  const userTypes = [
    {
      title: "For Legal Professionals",
      icon: Scale,
      benefits: [
        "Prepare more effectively for hearings",
        "Understand judicial preferences and patterns",
        "Compare judges for venue selection",
        "Save hours of manual research"
      ]
    },
    {
      title: "For Citizens & Litigants",
      icon: Users,
      benefits: [
        "Learn about the judge handling your case",
        "Understand typical case timelines",
        "See how similar cases were decided",
        "Make informed legal decisions"
      ]
    },
    {
      title: "For Legal Researchers",
      icon: BookOpen,
      benefits: [
        "Access comprehensive judicial data",
        "Track judicial trends over time",
        "Compare regional differences",
        "Export data for analysis"
      ]
    }
  ]

  const features = [
    { 
      name: 'Judge Profiles', 
      icon: Gavel, 
      color: 'text-blue-500',
      description: 'Complete professional backgrounds, education, and appointment history for every California judge'
    },
    { 
      name: 'Case Analytics', 
      icon: TrendingUp, 
      color: 'text-green-500',
      description: 'Visual charts showing case outcomes, average decision times, and ruling patterns'
    },
    { 
      name: 'Bias Detection', 
      icon: AlertCircle, 
      color: 'text-orange-500',
      description: 'Objective analysis identifying potential patterns or inconsistencies in judicial decisions'
    },
    { 
      name: 'Court Comparisons', 
      icon: Target, 
      color: 'text-purple-500',
      description: 'Side-by-side comparisons of multiple judges to help you understand differences'
    }
  ]


  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Hero Section with Advanced Effects */}
      <section className="relative min-h-screen flex items-center justify-center">
        <ParticleBackground />
        
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-background" />
        
        <motion.div 
          className="relative z-10 text-center px-4 max-w-6xl mx-auto"
          style={{ y, opacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-enterprise-primary to-enterprise-deep bg-clip-text text-transparent">
                Free Access to
              </span>
              <br />
              <TypewriterText text="Judicial Transparency" />
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Understanding Your Judge Has Never Been Easier
          </motion.p>
          
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {platformStats.monthlySearches}
              </div>
              <div className="text-sm text-muted-foreground mt-2">Monthly Searches</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                <AnimatedCounter end={platformStats.yearsOfData} /> Years
              </div>
              <div className="text-sm text-muted-foreground mt-2">Historical Data</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {platformStats.availability}
              </div>
              <div className="text-sm text-muted-foreground mt-2">Availability</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                <AnimatedCounter end={platformStats.dataBreaches} />
              </div>
              <div className="text-sm text-muted-foreground mt-2">Data Breaches</div>
            </div>
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

      {/* What We Offer */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">
              What We <span className="text-primary">Offer You</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to understand judicial decisions
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                className="group relative p-6 rounded-xl border border-border bg-card hover:bg-accent/5 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <benefit.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                  </div>
                </div>
                
                {/* Animated border gradient on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-enterprise-primary to-enterprise-deep opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Uses JudgeFinder */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Who Uses <span className="text-primary">JudgeFinder</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Trusted by thousands across California
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {userTypes.map((type, index) => (
              <motion.div
                key={type.title}
                className="p-6 rounded-xl border border-border bg-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center mb-4">
                  <type.icon className="w-8 h-8 text-primary mr-3" />
                  <h3 className="text-xl font-semibold">{type.title}</h3>
                </div>
                <ul className="space-y-3">
                  {type.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Showcase */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Powerful <span className="text-primary">Features</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Advanced tools made simple for everyone
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.button
                key={feature.name}
                className={`p-4 rounded-lg border border-border bg-card hover:bg-accent/10 transition-all ${
                  activeFeature === feature.name ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setActiveFeature(feature.name)}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <feature.icon className={`w-8 h-8 ${feature.color} mx-auto mb-2`} />
                <div className="text-sm font-medium">{feature.name}</div>
              </motion.button>
            ))}
          </div>
          
          <AnimatePresence mode="wait">
            {activeFeature && (
              <motion.div
                key={activeFeature}
                className="mt-8 p-6 rounded-xl border border-border bg-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h3 className="text-xl font-semibold mb-2">{activeFeature}</h3>
                <p className="text-muted-foreground">
                  {features.find(f => f.name === activeFeature)?.description}
                </p>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <Eye className="inline-block w-4 h-4 text-primary mr-2" />
                  <span className="text-sm">Click "Explore Judges" to see this feature in action</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Why Transparency <span className="text-primary">Matters</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Access to judicial information promotes fairness, accountability, and helps everyone make more informed legal decisions
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              className="p-6 rounded-xl bg-card border border-border"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-semibold mb-3 flex items-center">
                <Scale className="w-6 h-6 text-primary mr-2" />
                Equal Access to Justice
              </h3>
              <p className="text-muted-foreground">
                Everyone deserves to understand the judicial system. We provide the same information that expensive legal research services offer - completely free.
              </p>
            </motion.div>
            
            <motion.div
              className="p-6 rounded-xl bg-card border border-border"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-semibold mb-3 flex items-center">
                <Eye className="w-6 h-6 text-primary mr-2" />
                Public Accountability
              </h3>
              <p className="text-muted-foreground">
                Transparency leads to better judicial outcomes. When judicial patterns are visible, it promotes consistency and fairness in the legal system.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Why You Can <span className="text-primary">Trust Us</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Built on official data with complete transparency
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Award, label: 'Source Provenance', value: 'Tracked', desc: 'Every record lists sources' },
              { icon: Shield, label: 'Privacy Practices', value: 'Transparent', desc: 'See our Privacy Policy' },
              { icon: TrendingUp, label: 'Data Freshness', value: 'Daily', desc: 'Scheduled syncs, timestamps shown' },
              { icon: Users, label: 'Coverage', value: 'CA Courts', desc: 'Judges and decisions statewide' },
              { icon: CheckCircle, label: 'Metrics', value: 'Published', desc: 'Denominators on charts' },
              { icon: Heart, label: 'Access', value: 'Free', desc: 'Consumer search remains free' }
            ].map((metric, index) => (
              <motion.div
                key={metric.label}
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary mb-4">
                  <metric.icon className="w-8 h-8" />
                </div>
                <div className="text-3xl font-bold">
                  {metric.value}
                </div>
                <div className="text-sm font-medium mt-1">{metric.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{metric.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4">
            Start Your Research Today
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of Californians accessing transparent judicial information
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all transform hover:scale-105">
              Search Judges Free
            </button>
            <button className="px-8 py-3 rounded-lg border border-border bg-card font-semibold hover:bg-accent/10 transition-all">
              Learn More
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            <Sparkles className="inline-block w-4 h-4 mr-1" />
            No credit card required • No sign-up needed • Start searching immediately
          </p>
        </motion.div>
      </section>
    </div>
  )
}