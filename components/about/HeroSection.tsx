'use client'

import { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { AnimatedCounter } from '@/components/about/AnimatedCounter'
import { TypewriterText } from '@/components/about/TypewriterText'
import { ParticleBackground } from '@/components/about/ParticleBackground'

export interface PlatformStats {
  monthlySearches: string
  yearsOfData: number | null
  availability: string
  dataBreaches: number | null
}

export function HeroSection(): JSX.Element {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -50])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3])

  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    monthlySearches: 'Coming Soon',
    yearsOfData: null,
    availability: 'Monitoring',
    dataBreaches: null
  })

  useEffect(() => {
    const fetchPlatformStats = async (): Promise<void> => {
      try {
        const response = await fetch('/api/stats/platform')
        if (response.ok) {
          const data = await response.json()
          setPlatformStats({
            monthlySearches: typeof data.monthlySearches === 'string' ? data.monthlySearches : '—',
            yearsOfData: typeof data.yearsOfData === 'number' ? data.yearsOfData : null,
            availability: typeof data.availability === 'string' ? data.availability : '—',
            dataBreaches: typeof data.dataBreaches === 'number' ? data.dataBreaches : null
          })
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch platform stats:', error)
      }
    }
    fetchPlatformStats().catch(() => {})
  }, [])

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

        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }}>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">{platformStats.monthlySearches}</div>
            <div className="text-sm text-muted-foreground mt-2">Monthly Searches</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">
              {typeof platformStats.yearsOfData === 'number' ? (
                <>
                  <AnimatedCounter end={platformStats.yearsOfData} /> Years
                </>
              ) : (
                <span>—</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-2">Historical Data</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">{platformStats.availability}</div>
            <div className="text-sm text-muted-foreground mt-2">Availability</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">
              {typeof platformStats.dataBreaches === 'number' ? <AnimatedCounter end={platformStats.dataBreaches} /> : <span>—</span>}
            </div>
            <div className="text-sm text-muted-foreground mt-2">Data Breaches</div>
          </div>
        </motion.div>

        <motion.p className="mt-6 text-sm text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.6 }}>
          Transparent usage analytics are in development. We'll publish validated metrics once tracking is fully live.
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


