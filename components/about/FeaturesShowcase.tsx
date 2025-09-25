'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Eye, Gavel, Target, TrendingUp } from 'lucide-react'

export function FeaturesShowcase(): JSX.Element {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)

  const features = [
    { name: 'Judge Profiles', icon: Gavel, color: 'text-blue-500', description: 'Complete professional backgrounds, education, and appointment history for every California judge' },
    { name: 'Case Analytics', icon: TrendingUp, color: 'text-green-500', description: 'Visual charts showing case outcomes, average decision times, and ruling patterns' },
    { name: 'Bias Detection', icon: AlertCircle, color: 'text-orange-500', description: 'Objective analysis identifying potential patterns or inconsistencies in judicial decisions' },
    { name: 'Court Comparisons', icon: Target, color: 'text-purple-500', description: 'Side-by-side comparisons of multiple judges to help you understand differences' }
  ]

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-4xl font-bold mb-4">
            Powerful <span className="text-primary">Features</span>
          </h2>
          <p className="text-xl text-muted-foreground">Advanced tools made simple for everyone</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <motion.button
              key={feature.name}
              className={`p-4 rounded-lg border border-border bg-card hover:bg-accent/10 transition-all ${activeFeature === feature.name ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveFeature(feature.name)}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <feature.icon className={`w-8 h-8 ${feature.color} mx-auto mb-2`} />
              <div className="text-sm font-medium">{feature.name}</div>
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeFeature && (
            <motion.div key={activeFeature} className="mt-8 p-6 rounded-xl border border-border bg-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h3 className="text-xl font-semibold mb-2">{activeFeature}</h3>
              <p className="text-muted-foreground">{features.find(feature => feature.name === activeFeature)?.description}</p>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <Eye className="inline-block w-4 h-4 text-primary mr-2" />
                <span className="text-sm">Click "Explore Judges" to see this feature in action</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

export default FeaturesShowcase


