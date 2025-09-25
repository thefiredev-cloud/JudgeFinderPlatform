'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { TypewriterText } from '@/components/about/TypewriterText'
import { ParticleBackground } from '@/components/about/ParticleBackground'

export function HeroSection(): JSX.Element {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -50])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3])

  return (
    <section className="relative min-h-screen flex items-center justify-center">
      <ParticleBackground />

      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-background" />

      <motion.div className="relative z-10 text-center px-4 max-w-6xl mx-auto" style={{ y, opacity }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-enterprise-primary to-enterprise-deep bg-clip-text text-transparent">Free Access to</span>
            <br />
            <TypewriterText text="Judicial Transparency" />
          </h1>
        </motion.div>

        <motion.p className="text-xl md:text-2xl text-muted-foreground mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}>
          Understanding Your Judge Has Never Been Easier
        </motion.p>
      </motion.div>

      <motion.div className="absolute bottom-8 left-1/2 transform -translate-x-1/2" animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2" />
        </div>
      </motion.div>
    </section>
  )
}

export default HeroSection


