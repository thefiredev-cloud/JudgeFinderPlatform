import { SearchSection } from '@/components/judges/SearchSection'
import { PopularCourts } from '@/components/judges/PopularCourts'
import { WhatYoullLearn } from '@/components/ui/WhatYoullLearn'
import { WhyJudgeResearch } from '@/components/ui/WhyJudgeResearch'
import { StructuredData } from '@/components/seo/StructuredData'
import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      <StructuredData type="website" data={{}} />
      <StructuredData type="organization" data={{}} />
      
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Hero Section with Search */}
      <section className="relative px-4 py-20 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              Find Judicial Insights That
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                {" "}Win Cases
              </span>
            </h1>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-300 md:text-xl">
              Access comprehensive analytics on judges' ruling patterns, decision trends, 
              and case outcomes to build winning legal strategies.
            </p>
          </div>
          
          <SearchSection />
        </div>
      </section>

      {/* Popular Courts Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <PopularCourts />
        </div>
      </section>

      {/* What You'll Learn Section */}
      <section className="bg-gray-900/50 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <WhatYoullLearn />
        </div>
      </section>

      {/* Why Judge Research Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <WhyJudgeResearch />
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-gray-800 bg-gradient-to-r from-blue-900/20 to-purple-900/20 px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Start Your Judge Research Today
          </h2>
          <p className="mb-8 text-lg text-gray-300">
            Join thousands of legal professionals using data-driven insights to win cases
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link 
              href="/signup" 
              className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700 text-center"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/judges" 
              className="rounded-lg border border-gray-600 px-8 py-3 font-semibold text-white transition hover:bg-gray-800 text-center"
            >
              Browse Judges
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  )
}