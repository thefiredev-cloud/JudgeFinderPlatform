import { Suspense } from 'react'
import Header from '@/components/ui/Header'
import SearchSection from '@/components/judges/SearchSection'
import PopularCourts from '@/components/judges/PopularCourts'
import WhatYoullLearn from '@/components/ui/WhatYoullLearn'
import WhyJudgeResearch from '@/components/ui/WhyJudgeResearch'
import Footer from '@/components/ui/Footer'

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section with Search */}
        <section className="relative py-20 px-4 bg-pattern">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Find Your Assigned
              <br />
              <span className="text-gradient">Judge & Hire Expert</span>
              <br />
              Attorneys
            </h1>
            
            <p className="text-xl text-judge-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Got assigned a judge for your case? Search our database of{' '}
              <span className="font-semibold text-white">10,000+</span> judges, learn about their background and ruling patterns, and find experienced attorneys who know how to work with them.{' '}
              <span className="italic text-judge-blue-400">Free judge lookup</span>
              {' '}- get the insights you need for your legal case.
            </p>

            <Suspense fallback={<div className="h-20 animate-pulse bg-judge-slate-800 rounded-lg" />}>
              <SearchSection />
            </Suspense>
          </div>
        </section>

        {/* Popular Courts Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <PopularCourts />
          </div>
        </section>

        {/* What You'll Learn Section */}
        <section className="py-16 px-4 bg-judge-slate-900/50">
          <div className="max-w-6xl mx-auto">
            <WhatYoullLearn />
          </div>
        </section>

        {/* Why Judge Research Matters */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <WhyJudgeResearch />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}