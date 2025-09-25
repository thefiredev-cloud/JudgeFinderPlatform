'use client'

import { motion } from 'framer-motion'
import { BarChart3, Clock, FileText, Heart, Search, Shield } from 'lucide-react'

export function OfferGrid(): JSX.Element {
  const benefits = [
    { icon: Search, title: 'Find Your Judge Instantly', desc: 'Search any California judge by name, court, or jurisdiction to access their complete professional profile' },
    { icon: BarChart3, title: 'Understand Judicial Patterns', desc: 'View clear analytics on case outcomes, decision timing, and ruling trends - no legal degree required' },
    { icon: Shield, title: 'Your Information is Private', desc: 'We respect your privacy. We collect limited usage metrics and search queries to improve the service. See our Privacy Policy.' },
    { icon: Clock, title: 'Save Research Time', desc: 'Get comprehensive judge information in seconds instead of hours of manual research' },
    { icon: FileText, title: 'Access Real Court Data', desc: 'All information comes directly from official court records and public judicial databases' },
    { icon: Heart, title: 'Always Free to Use', desc: 'No subscriptions, no hidden fees. Equal access to justice information for everyone' }
  ]

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-4xl font-bold mb-4">
            What We <span className="text-primary">Offer You</span>
          </h2>
          <p className="text-xl text-muted-foreground">Everything you need to understand judicial decisions</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              className="group relative p-6 rounded-xl border border-border bg-card hover:bg-accent/5 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <benefit.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </div>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-enterprise-primary to-enterprise-deep opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default OfferGrid


