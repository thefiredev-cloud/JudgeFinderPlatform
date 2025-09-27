'use client'

import * as React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { motionPresets } from '@/lib/animations/config'

type GlassButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  asChild?: boolean
  children?: React.ReactNode
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2',
          'border border-white/10 bg-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_4px_20px_rgba(0,0,0,0.15)]',
          'backdrop-blur-md transition-all duration-300 hover:bg-white/14 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
          'active:scale-[0.99]',
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={motionPresets.smooth}
        {...props}
      >
        <span className="relative z-10">{children as React.ReactNode}</span>
        {/* Glow */}
        <span className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent" />
      </motion.button>
    )
  }
)

GlassButton.displayName = 'GlassButton'


