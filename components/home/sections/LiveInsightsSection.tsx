'use client'

import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'

type BuilderStyleChatProps = {
  headline?: string
  description?: string
  defaultPrompt?: string
  variant?: string
}

const BuilderStyleChat = dynamic<BuilderStyleChatProps>(() => import('@/components/ai/BuilderStyleChat'), {
  ssr: false,
  loading: () => null,
})

export function LiveInsightsSection(): JSX.Element {
  const benefits = useMemo(() => ([
    {
      title: 'Bias Radar',
      description: 'Detects plaintiff/defendant leanings, plea approvals, and sentencing severity.',
    },
    {
      title: 'Real-time Context',
      description: 'Daily sync jobs pull the newest rulings, so you never rely on stale data.',
    },
    {
      title: 'AI Co-Pilot',
      description: 'Ask natural-language questions about your judge and receive instant answers.',
    },
  ]), [])

  return (
    <section className="bg-gradient-to-br from-blue-950 via-slate-900 to-black py-16 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">Live analytics</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">See how your judge rules before you walk into court.</h2>
          <p className="mt-4 text-base text-blue-100">
            Every judge profile merges historical decisions, current assignments, and AI summarization. Our Edge cache keeps results snappy.
          </p>

          <ul className="mt-8 space-y-4 text-sm text-blue-100">
            {benefits.map((benefit) => (
              <li key={benefit.title} className="flex gap-3">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-blue-400" />
                <div>
                  <p className="font-semibold text-white">{benefit.title}</p>
                  <p className="text-blue-100/80">{benefit.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-blue-500/20 bg-black/30 p-4 shadow-xl shadow-blue-500/30 backdrop-blur"
        >
          <BuilderStyleChat
            headline="Ask the AI co-pilot"
            description="Summaries, bias signals, and courtroom tips on demand."
            defaultPrompt="Where does Judge Martinez lean in criminal cases?"
            variant="dark"
          />
        </motion.div>
      </div>
    </section>
  )
}
