'use client'

import { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { defaultPageTransition, fadeInUp } from '@/lib/animations/config'
import { usePathname } from 'next/navigation'

type PageTransitionProps = {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={fadeInUp.initial}
        animate={fadeInUp.animate}
        exit={fadeInUp.exit}
        transition={defaultPageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}


