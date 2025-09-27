'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export function SearchSection(): JSX.Element {
  const router = useRouter()

  const handleCountySelect = useCallback((county: string) => {
    const countySlugMap: Record<string, string> = {
      'Los Angeles': 'los-angeles-county',
      'Orange': 'orange-county',
      'San Diego': 'san-diego-county',
      'San Francisco': 'san-francisco-county',
      'Alameda': 'alameda-county',
      'Sacramento': 'sacramento-county',
    }

    const slug = countySlugMap[county] || `${county.toLowerCase().replace(/\s+/g, '-')}-county`
    router.push(`/jurisdictions/${slug}`)
  }, [router])

  return (
    <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 pb-12 lg:flex-row lg:items-center lg:pb-16">
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6 }}
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-blue-500/5 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Browse by County</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Jump straight to county-level directories with AI analytics baked in.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {['Los Angeles', 'Orange', 'San Diego', 'San Francisco', 'Alameda', 'Sacramento'].map((county) => (
              <button
                key={county}
                onClick={() => handleCountySelect(county)}
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
