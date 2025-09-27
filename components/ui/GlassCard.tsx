'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { motionPresets, scaleIn } from '@/lib/animations/config'

type GlassCardProps = {
  children: ReactNode
  className?: string
  hover?: boolean
}

export default function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'relative rounded-xl border border-white/10 bg-white/5 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)]',
        'backdrop-blur-md dark:border-white/10 dark:bg-white/5',
        'transition-colors duration-300',
        className
      )}
      initial={scaleIn.initial}
      whileInView={scaleIn.animate}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      whileHover={hover ? { scale: 1.01 } : undefined}
      transition={motionPresets.smooth}
    >
      {/* Subtle internal gradient tint */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/6 to-transparent" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}


