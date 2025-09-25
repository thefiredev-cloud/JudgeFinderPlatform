'use client'

import { motion } from 'framer-motion'

export function ParticleBackground(): JSX.Element {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(50)].map((__, particleIndex) => (
        <motion.div
          key={particleIndex}
          className="absolute h-1 w-1 bg-enterprise-primary/20 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)
          }}
          animate={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  )
}

export default ParticleBackground


