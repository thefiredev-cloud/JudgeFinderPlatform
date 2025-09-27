import Link from 'next/link'

export default function HomeHero(): JSX.Element {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-12 lg:pt-24 lg:pb-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-100">
              California Judicial Transparency
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl xl:text-6xl">
              <span className="block text-gray-900 dark:text-white">Just Got Assigned a Judge?</span>
              <span className="block bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Get Instant Insights
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Search any California judge to see ruling patterns, bias indicators, and case history instantly. Free, private, and updated daily.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-colors hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Find My Judge
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-base font-semibold text-gray-900 transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-gray-700 dark:text-gray-100 dark:hover:border-gray-600 dark:hover:bg-gray-800"
              >
                How It Works
              </Link>
            </div>
            <dl className="mt-10 grid gap-6 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-3">
              <div>
                <dt className="font-semibold text-gray-900 dark:text-white">Statewide Coverage</dt>
                <dd>Every active California judge</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900 dark:text-white">AI Bias Detection</dt>
                <dd>Six key analytics signals</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900 dark:text-white">Daily Updates</dt>
                <dd>New decisions synced twice a day</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-blue-500/5 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-200">
                    ⚖️
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">AI Bias Snapshot</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Example Judge · Example County</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                  91% Coverage
                </span>
              </div>

              <dl className="grid gap-6 px-5 py-6 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                  <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Criminal Sentencing Severity</dt>
                  <dd className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">46 / 100</dd>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">More lenient than 54% of CA judges</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                  <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Settlement Preference</dt>
                  <dd className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">High</dd>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Frequently encourages mediation pathways</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                  <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Recent Rulings Reviewed</dt>
                  <dd className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">128</dd>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Updated with decisions from the last 18 months</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                  <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Confidence Score</dt>
                  <dd className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">82%</dd>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Based on data completeness and consistency</p>
                </div>
              </dl>

              <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                Insights generated by Gemini 1.5 Flash with GPT-4o-mini verification. Cached for performance; refreshed when new cases arrive.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
