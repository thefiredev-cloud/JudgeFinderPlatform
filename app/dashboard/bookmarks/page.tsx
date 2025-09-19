import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookmarkIcon, ArrowLeftIcon } from 'lucide-react'
import { createClerkSupabaseServerClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils/slug'

export const dynamic = 'force-dynamic'

async function getUserBookmarks(userId: string) {
  try {
    const supabase = await createClerkSupabaseServerClient()
    
    const { data: bookmarks, error } = await supabase
      .from('user_bookmarks')
      .select(`
        id,
        judge_id,
        created_at,
        judges (
          id,
          name,
          court_name,
          jurisdiction,
          total_cases,
          appointed_date
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookmarks:', error)
      return []
    }

    return bookmarks || []
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error)
    return []
  }
}

export default async function BookmarksPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const bookmarkedJudges = await getUserBookmarks(userId)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center mb-4">
            <BookmarkIcon className="h-8 w-8 text-yellow-400 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-white">Saved Judges</h1>
              <p className="text-gray-400">
                {bookmarkedJudges.length} judges saved for easy access
              </p>
            </div>
          </div>
        </div>

        {/* Bookmarked Judges */}
        {bookmarkedJudges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedJudges.map((bookmark: any) => (
              <div
                key={bookmark.id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 hover:border-gray-600/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {bookmark.judges.name}
                    </h3>
                    <p className="text-blue-400 text-sm mb-2">{bookmark.judges.court_name}</p>
                    <p className="text-gray-400 text-sm">{bookmark.judges.jurisdiction}</p>
                  </div>
                  <BookmarkIcon className="h-5 w-5 text-yellow-400 fill-current" />
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Total Cases:</span>
                    <span className="text-green-400 font-medium">
                      {(bookmark.judges.total_cases || 0).toLocaleString()}
                    </span>
                  </div>
                  {bookmark.judges.appointed_date && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-400">Appointed:</span>
                      <span className="text-blue-400 font-medium">
                        {new Date(bookmark.judges.appointed_date).getFullYear()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Saved {new Date(bookmark.created_at).toLocaleDateString()}
                  </p>
                  <Link
                    href={`/judges/${generateSlug(bookmark.judges.name)}`}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    View Profile →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookmarkIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No saved judges yet</h3>
            <p className="text-gray-400 mb-6">
              Start exploring judges and bookmark the ones you find interesting
            </p>
            <Link
              href="/judges"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all shadow-lg"
            >
              Browse Judges
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/judges"
              className="flex items-center p-4 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 transition-colors group"
            >
              <div>
                <p className="font-medium text-white group-hover:text-blue-400">Find More Judges</p>
                <p className="text-sm text-gray-400">Browse our complete directory</p>
              </div>
            </Link>

            <Link
              href="/search"
              className="flex items-center p-4 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 transition-colors group"
            >
              <div>
                <p className="font-medium text-white group-hover:text-purple-400">Advanced Search</p>
                <p className="text-sm text-gray-400">Find judges by specialty</p>
              </div>
            </Link>

            <Link
              href="/compare"
              className="flex items-center p-4 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 transition-colors group"
            >
              <div>
                <p className="font-medium text-white group-hover:text-orange-400">Compare Judges</p>
                <p className="text-sm text-gray-400">Analyze saved judges</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}