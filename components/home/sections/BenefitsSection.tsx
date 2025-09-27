'use client'

import { motion } from 'framer-motion'
import { BarChart3, Brain, Lock, MessageSquare } from 'lucide-react'

const BENEFITS = [
  {
    icon: Brain,
    title: 'Know What to Expect',
    description: 'Understand your judge’s rulings before court starts.',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics You Can Trust',
    description: 'AI bias detection across six independent metrics.',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    icon: Lock,
    title: 'Private & Secure',
    description: 'No account required. You stay anonymous.',
    gradient: 'from-slate-500 to-slate-600',
  },
  {
    icon: MessageSquare,
    title: 'Built for Non-Lawyers',
    description: 'Plain-English explanations and actionable advice.',
    gradient: 'from-amber-500 to-amber-600',
  },
]

export function BenefitsSection(): JSX.Element {
  return (
    <section className="bg-white py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Why people trust JudgeFinder</h2>
            <p className="mt-3 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
              We combine court records, AI analytics, and legal expertise to surface the most important signals about every California judge.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Free. Fast. Updated daily.</p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-5 shadow-sm shadow-blue-500/5 transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:from-gray-800 dark:to-gray-900"
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r ${benefit.gradient} text-white`}>
                <benefit.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">{benefit.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
