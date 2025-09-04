'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { StructuredData } from '@/components/seo/StructuredData'
import BuilderStyleChat from '@/components/ai/BuilderStyleChat'
import AnimatedTechTiles from '@/components/home/AnimatedTechTiles'
import Link from 'next/link'
import { 
  Search, 
  BarChart3, Brain,
  MessageSquare, Bot, ArrowRight, Database, Lock,
  Sparkles
} from 'lucide-react'

// Animated counter component - simplified with SSR support
function AnimatedCounter({ end, duration = 1000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (!mounted) return
    
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration, mounted])
  
  // Return static number during SSR, animated number after mount
  return <span>{mounted ? count.toLocaleString() : end.toLocaleString()}</span>
}


export default function HomePage() {
  const [heroRef, heroInView] = useInView({ threshold: 0.1, triggerOnce: true })
  
  const benefits = [
    { 
      icon: Bot, 
      title: "AI Legal Assistant", 
      desc: "Get instant answers about any California judge",
      color: 'from-blue-500 to-blue-600'
    },
    { 
      icon: BarChart3, 
      title: "Real-Time Analytics", 
      desc: "Live bias detection with machine learning",
      color: 'from-green-500 to-green-600'
    },
    { 
      icon: Lock, 
      title: "Complete Privacy", 
      desc: "Anonymous and secure searches",
      color: 'from-blue-700 to-blue-900'
    },
    { 
      icon: Database, 
      title: "Comprehensive Data", 
      desc: "300,000+ cases analyzed",
      color: 'from-orange-500 to-orange-600'
    }
  ]

  
  return (
    <>
      <StructuredData type="website" data={{}} />
      <StructuredData type="organization" data={{}} />
      
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white overflow-hidden">
        {/* Simplified Hero Section */}
        <section ref={heroRef} className="relative min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh] flex items-center py-8 sm:py-12 lg:py-16">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(147,51,234,0.1),transparent_50%)]" />
          </div>
          
          {/* Main Content - Builder.io Style Layout */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Content */}
              <div>
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: heroInView ? 1 : 0, y: heroInView ? 0 : 20 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-6"
                >
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Judicial Analytics
                </motion.div>
                
                {/* Main Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: heroInView ? 1 : 0, y: heroInView ? 0 : 30 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight"
                >
                  <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    Understand Your Judge
                  </span>
                  <br />
                  <span className="text-gray-900 dark:text-white">
                    Before You Enter Court
                  </span>
                </motion.h1>
                
                {/* Subheading */}
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: heroInView ? 1 : 0, y: heroInView ? 0 : 30 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 leading-relaxed"
                >
                  AI-powered analysis of California judges. Discover bias patterns, 
                  ruling tendencies, and comprehensive analytics in seconds.
                </motion.p>
                
                {/* Secondary CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: heroInView ? 1 : 0, y: heroInView ? 0 : 30 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                >
                  <Link 
                    href="/judges"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold transition-all text-sm sm:text-base"
                  >
                    <Search className="w-5 h-5" />
                    Browse All Judges
                  </Link>
                </motion.div>
              </div>
              
              {/* Right Column - Builder-Style Chat */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: heroInView ? 1 : 0, x: heroInView ? 0 : 30 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <BuilderStyleChat />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Animated Tech Tiles Section - Replacing verbose sections */}
        <AnimatedTechTiles />

        {/* Simplified Benefits Section */}
        <section className="py-16 px-4 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
                >
                  <div className={`w-10 h-10 mb-3 rounded-lg bg-gradient-to-r ${benefit.color} flex items-center justify-center`}>
                    <benefit.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Join thousands of attorneys and citizens using AI to understand judicial patterns
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="#hero"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-600 font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
                  onClick={(e) => {
                    e.preventDefault()
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  <MessageSquare className="w-5 h-5" />
                  Chat with AI Assistant
                </Link>
                <Link 
                  href="/sign-up"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white text-white font-semibold hover:bg-white/10 transition-all"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </>
  )
}