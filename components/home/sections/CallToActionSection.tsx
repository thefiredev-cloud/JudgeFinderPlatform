'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageSquare } from 'lucide-react'

export function CallToActionSection(): JSX.Element {
  return (
    <section id="how-it-works" className="bg-gradient-to-b from-white to-gray-50 py-16 dark:from-gray-900 dark:to-black">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-gray-100 bg-white px-6 py-12 shadow-lg shadow-blue-500/10 dark:border-gray-800 dark:bg-gray-900"
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Ready in under 30 seconds
          </h2>
          <p className="mt-4 text-base text-gray-600 dark:text-gray-300">
            Type your judge’s name, review bias signals, and build a courtroom strategy with confidence. All for free.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="#judge-search"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <MessageSquare className="h-5 w-5" />
              Search for Your Judge
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-base font-semibold text-gray-900 transition hover:border-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-800"
            >
              Compare Judges
            </Link>
          </div>

          <div className="mt-8 grid gap-6 text-sm text-gray-500 dark:text-gray-400 sm:grid-cols-3">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Data-backed insights</p>
              <p className="mt-1">Powered by CourtListener® and daily sync jobs.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">AI audited</p>
              <p className="mt-1">Gemini insights double-checked with GPT-4o-mini.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Always improving</p>
              <p className="mt-1">Help us stay transparent by sharing feedback.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
