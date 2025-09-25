'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export function CTASection(): JSX.Element {
  return (
    <section className="py-20 px-4 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
      <motion.div className="max-w-4xl mx-auto text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="text-4xl font-bold mb-4">Start Your Research Today</h2>
        <p className="text-xl text-muted-foreground mb-8">Join thousands of Californians accessing transparent judicial information</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all transform hover:scale-105">Search Judges Free</button>
          <button className="px-8 py-3 rounded-lg border border-border bg-card font-semibold hover:bg-accent/10 transition-all">Learn More</button>
        </div>
        <p className="text-sm text-muted-foreground mt-6">
          <Sparkles className="inline-block w-4 h-4 mr-1" />
          No credit card required • No sign-up needed • Start searching immediately
        </p>
      </motion.div>
    </section>
  )
}

export default CTASection


