import Link from 'next/link'
import { Building, Users, TrendingUp, ArrowRight } from 'lucide-react'

export function PopularCourts() {
  const courts = [
    {
      id: 1,
      name: 'U.S. Supreme Court',
      jurisdiction: 'Federal',
      judgeCount: 9,
      caseCount: '60-70/year',
      trend: '+5%',
      slug: 'us-supreme-court'
    },
    {
      id: 2,
      name: 'Superior Court of California, Los Angeles',
      jurisdiction: 'California',
      judgeCount: 429,
      caseCount: '30,000+/year',
      trend: '+12%',
      slug: 'la-superior-court'
    },
    {
      id: 3,
      name: 'Southern District of New York',
      jurisdiction: 'Federal',
      judgeCount: 28,
      caseCount: '13,000+/year',
      trend: '+8%',
      slug: 'sdny'
    },
    {
      id: 4,
      name: 'Court of Appeals for the Federal Circuit',
      jurisdiction: 'Federal',
      judgeCount: 12,
      caseCount: '1,500+/year',
      trend: '+15%',
      slug: 'federal-circuit'
    }
  ]

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Popular Courts</h2>
        <Link href="/courts" className="flex items-center text-blue-400 hover:text-blue-300">
          View all courts
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {courts.map((court) => (
          <Link
            key={court.id}
            href={`/courts/${court.slug}`}
            className="group rounded-lg border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-blue-600/50 hover:bg-gray-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <Building className="h-8 w-8 text-blue-400" />
              <span className="flex items-center text-sm text-green-400">
                <TrendingUp className="mr-1 h-3 w-3" />
                {court.trend}
              </span>
            </div>
            <h3 className="mb-2 font-semibold group-hover:text-blue-400">{court.name}</h3>
            <p className="mb-3 text-sm text-gray-400">{court.jurisdiction}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center">
                <Users className="mr-1 h-3 w-3" />
                {court.judgeCount} judges
              </span>
              <span>{court.caseCount}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}