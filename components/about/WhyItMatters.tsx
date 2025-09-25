'use client'

import { motion } from 'framer-motion'
import { Eye, Scale } from 'lucide-react'

export function WhyItMatters(): JSX.Element {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-4xl font-bold mb-4">
            Why Transparency <span className="text-primary">Matters</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Access to judicial information promotes fairness, accountability, and helps everyone make more informed legal decisions</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div className="p-6 rounded-xl bg-card border border-border" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <Scale className="w-6 h-6 text-primary mr-2" />
              Equal Access to Justice
            </h3>
            <p className="text-muted-foreground">Everyone deserves to understand the judicial system. We provide the same information that expensive legal research services offer - completely free.</p>
          </motion.div>

          <motion.div className="p-6 rounded-xl bg-card border border-border" initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <Eye className="w-6 h-6 text-primary mr-2" />
              Public Accountability
            </h3>
            <p className="text-muted-foreground">Transparency leads to better judicial outcomes. When judicial patterns are visible, it promotes consistency and fairness in the legal system.</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default WhyItMatters


