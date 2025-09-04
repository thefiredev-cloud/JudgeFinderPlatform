'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { StructuredData } from '@/components/seo/StructuredData'
import BuilderStyleChat from '@/components/ai/BuilderStyleChat'
import AnimatedTechTiles from '@/components/home/AnimatedTechTiles'
import Link from 'next/link'
import { 
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
        {/* Mobile-First Hero Section */}
        <section ref={heroRef} className="relative flex flex-col items-center pt-4 pb-8 lg:pt-16 lg:pb-12">
          {/* Subtle Background Pattern - Hidden on mobile */}
          <div className="absolute inset-0 opacity-5 hidden lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(147,51,234,0.1),transparent_50%)]" />
          </div>
          
          {/* Main Content - Mobile First Layout */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4">
            {/* Mobile Layout: Chat First, then brief intro */}
            <div className="lg:hidden">
              {/* Compact Header for Mobile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: heroInView ? 1 : 0, y: heroInView ? 0 : 20 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
                  <Sparkles className="w-3 h-3" />
                  AI-Powered Judicial Analytics
                </div>
                
                <h1 className="text-2xl font-bold mb-2 leading-tight">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    Understand Your Judge
                  </span>
                </h1>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 px-4">
                  Get instant AI analysis of California judges
                </p>
              </motion.div>

              {/* Chat Interface - Primary Focus on Mobile */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: heroInView ? 1 : 0, scale: heroInView ? 1 : 0.95 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-8"
              >
                <BuilderStyleChat />
              </motion.div>

              {/* Quick Stats - Simplified for Mobile */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: heroInView ? 1 : 0, y: heroInView ? 0 : 20 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-2xl font-bold text-blue-600">1,810</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">CA Judges</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: heroInView ? 1 : 0, y: heroInView ? 0 : 20 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-2xl font-bold text-green-600">300K+</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Cases Analyzed</div>
                </motion.div>
              </div>
            </div>

            {/* Desktop Layout: Traditional Two-Column */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-12 items-center">
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
                  className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight"
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
                  className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
                >
                  AI-powered analysis of California judges. Discover bias patterns, 
                  ruling tendencies, and comprehensive analytics in seconds.
                </motion.p>
              </div>
              
              {/* Right Column - Chat */}
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

        {/* Benefits Grid - Mobile Optimized */}
        <section className="py-8 lg:py-16 px-4 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            {/* Mobile: 2x2 Grid, Desktop: 1x4 Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 lg:p-5 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
                >
                  <div className={`w-8 h-8 lg:w-10 lg:h-10 mb-2 lg:mb-3 rounded-lg bg-gradient-to-r ${benefit.color} flex items-center justify-center`}>
                    <benefit.icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                  <h3 className="text-sm lg:text-base font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Animated Tech Tiles - Hidden on Mobile, Shown on Desktop */}
        <div className="hidden lg:block">
          <AnimatedTechTiles />
        </div>

        {/* Simplified Mobile Stats Section */}
        <section className="lg:hidden py-8 px-4 bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="max-w-md mx-auto text-center text-white">
            <h2 className="text-xl font-bold mb-4">
              Trusted by Legal Professionals
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">50+</div>
                <div className="text-xs opacity-90">Data Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold">Real-Time</div>
                <div className="text-xs opacity-90">Analysis</div>
              </div>
              <div>
                <div className="text-2xl font-bold">95%</div>
                <div className="text-xs opacity-90">Accuracy</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Mobile Optimized */}
        <section className="py-12 lg:py-20 px-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black lg:bg-gradient-to-r lg:from-blue-600 lg:to-blue-800">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white lg:text-white mb-3 lg:mb-4">
                Start Your Search Now
              </h2>
              <p className="text-base lg:text-xl text-gray-600 dark:text-gray-300 lg:text-white/90 mb-6 lg:mb-8">
                Free access to judicial analytics
              </p>
              
              {/* Mobile: Single prominent CTA */}
              <div className="lg:hidden">
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-lg shadow-lg transform active:scale-95 transition-all"
                >
                  <MessageSquare className="w-5 h-5 inline-block mr-2" />
                  Ask About Any Judge
                </button>
                
                <Link 
                  href="/sign-up"
                  className="inline-block mt-4 text-sm text-gray-600 dark:text-gray-400 underline"
                >
                  Create account for more features
                </Link>
              </div>

              {/* Desktop: Two CTAs */}
              <div className="hidden lg:flex flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-600 font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
                >
                  <MessageSquare className="w-5 h-5" />
                  Chat with AI Assistant
                </button>
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