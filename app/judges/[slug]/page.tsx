import { notFound } from 'next/navigation'
import { JudgeProfile } from '@/components/judges/JudgeProfile'
import { JudgeRulingPatterns } from '@/components/judges/JudgeRulingPatterns'
import { RecentDecisions } from '@/components/judges/RecentDecisions'
import { AttorneySlots } from '@/components/judges/AttorneySlots'
import { JudgeFAQ } from '@/components/judges/JudgeFAQ'
import type { Judge } from '@/types'

// This would normally fetch from your database
async function getJudge(slug: string): Promise<Judge | null> {
  // Placeholder for database fetch
  // const judge = await fetchJudgeBySlug(slug)
  
  // Mock data for demonstration
  if (slug === 'judge-sarah-johnson') {
    return {
      id: '2738',
      name: 'Judge Sarah Johnson',
      court_id: 'court-001',
      court_name: 'Superior Court of California, Los Angeles County',
      jurisdiction: 'California',
      appointed_date: '2015-03-15',
      education: 'Harvard Law School, JD 1995',
      profile_image_url: '/judges/sarah-johnson.jpg',
      bio: 'Judge Sarah Johnson has served on the Superior Court bench since 2015, bringing extensive experience in civil litigation and criminal law.',
      total_cases: 3847,
      reversal_rate: 0.12,
      average_decision_time: 45,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  }
  return null
}

export default async function JudgePage({ params }: { params: { slug: string } }) {
  const judge = await getJudge(params.slug)

  if (!judge) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 px-4 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 text-sm font-medium text-gray-300">
            Home / Judges / {judge.jurisdiction} / {judge.name}
          </div>
          <h1 className="mb-2 text-4xl font-bold">{judge.name}</h1>
          <p className="text-xl text-gray-300">{judge.court_name}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Profile and Patterns */}
          <div className="lg:col-span-2 space-y-8">
            <JudgeProfile judge={judge} />
            <JudgeRulingPatterns judgeId={judge.id} />
            <RecentDecisions judgeId={judge.id} />
          </div>

          {/* Right Column - Attorney Slots and FAQ */}
          <div className="space-y-8">
            <AttorneySlots judgeId={judge.id} judgeName={judge.name} />
            <JudgeFAQ judgeName={judge.name} />
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const judge = await getJudge(params.slug)
  
  if (!judge) {
    return {
      title: 'Judge Not Found',
    }
  }

  return {
    title: `${judge.name} - Judicial Profile & Analytics | JudgeFinder.io`,
    description: `Research ${judge.name} from ${judge.court_name}. View ruling patterns, decision trends, reversal rates, and comprehensive judicial analytics.`,
    openGraph: {
      title: `${judge.name} - Judicial Profile`,
      description: `Comprehensive analytics and insights for ${judge.name}`,
      type: 'profile',
    },
  }
}