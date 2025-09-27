'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'

const AIUnifiedSearch = dynamic(() => import('@/components/ui/AIUnifiedSearch'), {
  ssr: false,
})

export function SearchSection(): JSX.Element {
  const router = useRouter()

  const handleExampleClick = useCallback((query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }, [router])

  return (
    <section id="judge-search" className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 pb-12 lg:flex-row lg:items-center lg:pb-16">
      <div className="order-2 flex-1 lg:order-1">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-blue-500/5 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Search by Judge Name</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Type at least two letters to see instant matches and AI-powered suggestions.</p>

          <div className="mt-6">
            <AIUnifiedSearch autoFocus={false} showVoiceSearch showHistory />
          </div>

          <div className="mt-5 text-xs text-gray-500 dark:text-gray-400">
            We never store your queries. Results are cached for speed and refreshed every few minutes.
          </div>
        </div>
      </div>

      <motion.div
        className="order-1 flex-1 space-y-6 lg:order-2"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6 }}
      >
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-6 dark:border-gray-700 dark:from-blue-900/30 dark:to-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Popular Searches</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">See patterns and bias signals for these frequently requested judges.</p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {['Judge Lauren Martinez', 'Judge Michael Chen', 'Judge Olivia Ramirez', 'Judge Anthony Brooks', 'Judge Sophia Patel', 'Judge Daniel Alvarez'].map((name) => (
              <button
                key={name}
                onClick={() => handleExampleClick(name)}
                className="rounded-lg border border-transparent bg-white/60 px-3 py-2 text-left text-sm font-medium text-gray-700 shadow-sm transition hover:border-blue-200 hover:bg-white hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-gray-900/40 dark:text-gray-200 dark:hover:border-blue-700/50 dark:hover:text-blue-200"
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Browse by County</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Jump straight to county-level directories with AI analytics baked in.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {['Los Angeles', 'Orange', 'San Diego', 'San Francisco', 'Alameda', 'Sacramento'].map((county) => (
              <button
                key={county}
                onClick={() => router.push(`/jurisdictions/${county.toLowerCase().replace(/\s+/g, '-')}`)}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-700/50 dark:hover:text-blue-200"
              >
                {county} County
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
