import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Header from '@/components/ui/Header'
import JudgeProfile from '@/components/judges/JudgeProfile'
import JudgeRulingPatterns from '@/components/judges/JudgeRulingPatterns'
import RecentDecisions from '@/components/judges/RecentDecisions'
import AttorneySlots from '@/components/judges/AttorneySlots'
import JudgeFAQ from '@/components/judges/JudgeFAQ'
import Footer from '@/components/ui/Footer'

// Mock data - in real app this would come from database
const mockJudgeData = {
  'john-glover-roberts-jr': {
    id: 1,
    name: 'John Glover Roberts jr',
    court: 'Unknown Court',
    image: null,
    appointedBy: 'Unknown',
    yearsOfService: 'N/A',
    education: 'N/A',
    rulingPatterns: {
      available: false,
      reason: 'Ruling tendency data is not available for this judge from the CourtListener API. This could be due to limited case data or the judge being newly appointed.'
    },
    recentDecisions: {
      available: false,
      reason: 'Recent case data is not available for this judge from the CourtListener API. This could be due to limited case data or the judge being newly appointed.'
    }
  }
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const judge = mockJudgeData[slug as keyof typeof mockJudgeData]

  if (!judge) {
    return {
      title: 'Judge Not Found',
    }
  }

  return {
    title: `${judge.name} - Judge Profile & Attorney Directory`,
    description: `Learn about Judge ${judge.name}, their background, ruling patterns, and find experienced attorneys who have appeared before them.`,
  }
}

export default async function JudgeProfilePage({ params }: PageProps) {
  const { slug } = await params
  const judge = mockJudgeData[slug as keyof typeof mockJudgeData]

  if (!judge) {
    notFound()
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Back to Search */}
          <div className="mb-6">
            <a
              href="/"
              className="inline-flex items-center text-judge-slate-400 hover:text-white transition-colors"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Search
            </a>
          </div>

          {/* Judge Profile Header */}
          <Suspense fallback={<div className="h-40 animate-pulse bg-judge-slate-800 rounded-lg" />}>
            <JudgeProfile judge={judge} />
          </Suspense>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Ruling Patterns */}
              <Suspense fallback={<div className="h-60 animate-pulse bg-judge-slate-800 rounded-lg" />}>
                <JudgeRulingPatterns patterns={judge.rulingPatterns} />
              </Suspense>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Recent Decisions */}
              <Suspense fallback={<div className="h-60 animate-pulse bg-judge-slate-800 rounded-lg" />}>
                <RecentDecisions decisions={judge.recentDecisions} />
              </Suspense>
            </div>
          </div>

          {/* Attorney Advertisement Slots */}
          <div className="mt-12">
            <AttorneySlots judgeId={judge.id} />
          </div>

          {/* What to Expect Section */}
          <div className="mt-12 card">
            <h3 className="text-xl font-semibold text-white mb-4">What to Expect in jr's Courtroom</h3>
            <ul className="space-y-3 text-judge-slate-300">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-judge-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                This judge was appointed by Unknown
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-judge-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                They have experience with various case types including civil disputes, criminal matters, and contract issues
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-judge-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Having an experienced attorney who knows this judge's preferences can be very helpful for your case
              </li>
            </ul>
          </div>

          {/* FAQ Section */}
          <div className="mt-12">
            <JudgeFAQ judgeName={judge.name} />
          </div>

          {/* Need Legal Help */}
          <div className="mt-12 card bg-judge-blue-900/20 border-judge-blue-800">
            <h3 className="text-xl font-semibold text-white mb-2">Need Legal Help?</h3>
            <p className="text-judge-slate-300 mb-4">
              If you have a case before {judge.name}, consider consulting with attorneys who have experience in their courtroom. 
              Our directory shows qualified lawyers who understand this judge's preferences and can help with your legal matter.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}