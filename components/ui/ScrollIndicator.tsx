'use client'

import { motion } from 'framer-motion'

export function ScrollIndicator() {
  return (
    <motion.div 
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      animate={{ y: [0, 10, 0] }}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
        <div className="w-1 h-3 bg-primary rounded-full mt-2" />
      </div>
    </motion.div>
  )
}