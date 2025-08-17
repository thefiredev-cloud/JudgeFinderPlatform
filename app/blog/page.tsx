import { Calendar, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function BlogPage() {
  const posts = [
    {
      title: 'Understanding Judicial Analytics: A Comprehensive Guide',
      excerpt: 'Learn how data-driven insights can transform your legal practice and improve case outcomes.',
      author: 'Sarah Johnson',
      date: 'Jan 15, 2024',
      slug: 'understanding-judicial-analytics'
    },
    {
      title: 'Top 10 Factors That Influence Judicial Decisions',
      excerpt: 'Research reveals key patterns in how judges make decisions across different case types.',
      author: 'Michael Chen',
      date: 'Jan 10, 2024',
      slug: 'factors-influencing-decisions'
    },
    {
      title: 'How AI is Revolutionizing Legal Research',
      excerpt: 'Explore the latest AI technologies transforming how attorneys prepare for cases.',
      author: 'Emily Rodriguez',
      date: 'Jan 5, 2024',
      slug: 'ai-legal-research'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
          <p className="mt-2 text-gray-600">Insights and updates from the JudgeFinder team</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article key={post.slug} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  <Link href={`/blog/${post.slug}`} className="hover:text-blue-600">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {post.author}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {post.date}
                    </span>
                  </div>
                </div>
                <Link href={`/blog/${post.slug}`} className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700 font-medium">
                  Read more
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
