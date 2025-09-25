'use client'

import { motion } from 'framer-motion'
import { BookOpen, CheckCircle, Scale, Users } from 'lucide-react'

export function UserTypes(): JSX.Element {
  const userTypes = [
    { title: 'For Legal Professionals', icon: Scale, benefits: ['Prepare more effectively for hearings', 'Understand judicial preferences and patterns', 'Compare judges for venue selection', 'Save hours of manual research'] },
    { title: 'For Citizens & Litigants', icon: Users, benefits: ['Learn about the judge handling your case', 'Understand typical case timelines', 'See how similar cases were decided', 'Make informed legal decisions'] },
    { title: 'For Legal Researchers', icon: BookOpen, benefits: ['Access comprehensive judicial data', 'Track judicial trends over time', 'Compare regional differences', 'Export data for analysis'] }
  ]

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-4xl font-bold mb-4">
            Who Uses <span className="text-primary">JudgeFinder</span>
          </h2>
          <p className="text-xl text-muted-foreground">Trusted by thousands across California</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {userTypes.map((type, index) => (
            <motion.div key={type.title} className="p-6 rounded-xl border border-border bg-card" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
              <div className="flex items-center mb-4">
                <type.icon className="w-8 h-8 text-primary mr-3" />
                <h3 className="text-xl font-semibold">{type.title}</h3>
              </div>
              <ul className="space-y-3">
                {type.benefits.map((benefit, benefitIndex) => (
                  <li key={benefitIndex} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default UserTypes


