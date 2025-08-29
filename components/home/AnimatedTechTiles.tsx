'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, Database, Zap, BarChart3, Shield, 
  Server, Cpu, GitBranch, Activity, Lock,
  Search, Scale, FileText, Users, TrendingUp
} from 'lucide-react'

interface TileData {
  id: string
  title: string
  icon: any
  gradient: string
  stat?: string
}

const topRowTiles: TileData[] = [
  { id: '1', title: '1,810', stat: 'CA Judges Analyzed', icon: Scale, gradient: 'from-blue-500 to-blue-600' },
  { id: '2', title: '300,204+', stat: 'Court Cases Processed', icon: FileText, gradient: 'from-purple-500 to-purple-600' },
  { id: '3', title: '50+', stat: 'Data Points Per Judge', icon: Database, gradient: 'from-green-500 to-green-600' },
  { id: '4', title: 'Real-Time', stat: 'Bias Detection', icon: Activity, gradient: 'from-orange-500 to-orange-600' },
  { id: '5', title: 'ML-Powered', stat: 'Pattern Analysis', icon: Brain, gradient: 'from-pink-500 to-pink-600' },
  { id: '6', title: '104', stat: 'CA Courts Covered', icon: Shield, gradient: 'from-indigo-500 to-indigo-600' },
  { id: '7', title: '5-Metric', stat: 'Bias Scoring System', icon: BarChart3, gradient: 'from-red-500 to-red-600' },
  { id: '8', title: 'Daily', stat: 'Data Synchronization', icon: Zap, gradient: 'from-teal-500 to-teal-600' },
]

const bottomRowTiles: TileData[] = [
  { id: '9', title: 'Google Gemini', stat: 'AI Engine', icon: Cpu, gradient: 'from-cyan-500 to-cyan-600' },
  { id: '10', title: 'GPT-4', stat: 'Fallback Processing', icon: GitBranch, gradient: 'from-violet-500 to-violet-600' },
  { id: '11', title: 'Redis', stat: 'Analytics Cache', icon: Server, gradient: 'from-amber-500 to-amber-600' },
  { id: '12', title: 'CourtListener', stat: 'Data Source', icon: Search, gradient: 'from-emerald-500 to-emerald-600' },
  { id: '13', title: 'Supabase', stat: 'Database Platform', icon: Database, gradient: 'from-blue-500 to-blue-600' },
  { id: '14', title: 'Next.js 14', stat: 'Framework', icon: Zap, gradient: 'from-gray-600 to-gray-700' },
  { id: '15', title: 'Secure', stat: 'Anonymous Searches', icon: Lock, gradient: 'from-purple-500 to-purple-600' },
  { id: '16', title: '60-95%', stat: 'AI Accuracy', icon: TrendingUp, gradient: 'from-green-500 to-green-600' },
]

function TileRow({ tiles, direction = 'left' }: { tiles: TileData[], direction?: 'left' | 'right' }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  
  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return
    
    const scrollSpeed = 0.5
    let scrollPosition = direction === 'left' ? 0 : scrollContainer.scrollWidth / 2
    
    const animate = () => {
      if (!scrollContainer) return
      
      if (direction === 'left') {
        scrollPosition += scrollSpeed
        if (scrollPosition >= scrollContainer.scrollWidth / 2) {
          scrollPosition = 0
        }
      } else {
        scrollPosition -= scrollSpeed
        if (scrollPosition <= 0) {
          scrollPosition = scrollContainer.scrollWidth / 2
        }
      }
      
      scrollContainer.scrollLeft = scrollPosition
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [direction])
  
  const duplicatedTiles = [...tiles, ...tiles]
  
  return (
    <div 
      ref={scrollRef}
      className="flex overflow-hidden gap-4 py-2"
      style={{ scrollBehavior: 'auto' }}
    >
      {duplicatedTiles.map((tile, index) => (
        <motion.div
          key={`${tile.id}-${index}`}
          className="flex-shrink-0 group"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="relative w-56 sm:w-64 h-28 sm:h-32 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className={`absolute inset-0 bg-gradient-to-br ${tile.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
            
            <div className="relative p-4 sm:p-6 h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tile.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {tile.stat}
                  </p>
                </div>
                <div className={`p-2 rounded-lg bg-gradient-to-r ${tile.gradient}`}>
                  <tile.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default function AnimatedTechTiles() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powered by <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Advanced Technology</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Real-time judicial analytics powered by cutting-edge AI and verified court data
          </p>
        </motion.div>
        
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <TileRow tiles={topRowTiles} direction="left" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <TileRow tiles={bottomRowTiles} direction="right" />
          </motion.div>
        </div>
        
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">
            All data sourced from public court records. Analytics generated using machine learning algorithms with continuous validation and updates.
          </p>
        </motion.div>
      </div>
    </section>
  )
}