'use client'

import { motion } from 'framer-motion'
import { Award, CheckCircle, Heart, Shield, TrendingUp, Users } from 'lucide-react'

export function TrustIndicators(): JSX.Element {
  const metrics = [
    { icon: Award, label: 'Source Provenance', value: 'Tracked', desc: 'Every record lists sources' },
    { icon: Shield, label: 'Privacy Practices', value: 'Transparent', desc: 'See our Privacy Policy' },
    { icon: TrendingUp, label: 'Data Freshness', value: 'Daily', desc: 'Scheduled syncs, timestamps shown' },
    { icon: Users, label: 'Coverage', value: 'CA Courts', desc: 'Judges and decisions statewide' },
    { icon: CheckCircle, label: 'Metrics', value: 'Published', desc: 'Denominators on charts' },
    { icon: Heart, label: 'Access', value: 'Free', desc: 'Consumer search remains free' }
  ]

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-4xl font-bold mb-4">
            Why You Can <span className="text-primary">Trust Us</span>
          </h2>
          <p className="text-xl text-muted-foreground">Built on official data with complete transparency</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {metrics.map((metric, index) => (
            <motion.div key={metric.label} className="text-center" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
              <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary mb-4">
                <metric.icon className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold">{metric.value}</div>
              <div className="text-sm font-medium mt-1">{metric.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{metric.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TrustIndicators


