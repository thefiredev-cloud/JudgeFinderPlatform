'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSafeUser, SafeSignInButton } from '@/lib/auth/safe-clerk-components'
import { BookmarkIcon, LoaderIcon } from 'lucide-react'

interface BookmarkButtonProps {
  judgeId: string
  judgeName: string
  className?: string
}

export function BookmarkButton({ judgeId, judgeName, className = '' }: BookmarkButtonProps) {
  const { isSignedIn, isLoaded } = useSafeUser()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const checkBookmarkStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/user/bookmarks')
      if (response.ok) {
        const { bookmarks } = await response.json()
        const isBookmarked = bookmarks.some((bookmark: any) => 
          bookmark.judges.id === judgeId
        )
        setIsBookmarked(isBookmarked)
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error)
    }
  }, [judgeId])

  useEffect(() => {
    if (isSignedIn && isLoaded) {
      checkBookmarkStatus()
    }
  }, [isSignedIn, isLoaded, judgeId, checkBookmarkStatus])

  const toggleBookmark = async () => {
    if (!isSignedIn) return

    setIsLoading(true)
    try {
      const method = isBookmarked ? 'DELETE' : 'POST'
      const response = await fetch('/api/user/bookmarks', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ judge_id: judgeId }),
      })

      if (response.ok) {
        setIsBookmarked(!isBookmarked)
        
        // Log activity
        await fetch('/api/user/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            activity_type: 'bookmark',
            judge_id: judgeId,
            activity_data: {
              action: isBookmarked ? 'removed' : 'added',
              judge_name: judgeName
            }
          }),
        })
      } else {
        const error = await response.json()
        console.error('Bookmark error:', error)
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <LoaderIcon className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <SafeSignInButton mode="modal">
        <button className={`flex items-center space-x-2 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-600/50 transition-colors ${className}`}>
          <BookmarkIcon className="h-5 w-5 text-gray-400" />
          <span className="text-gray-300">Save Judge</span>
        </button>
      </SafeSignInButton>
    )
  }

  return (
    <button
      onClick={toggleBookmark}
      disabled={isLoading}
      className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
        isBookmarked
          ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30'
          : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50'
      } ${className}`}
    >
      {isLoading ? (
        <LoaderIcon className="h-5 w-5 animate-spin" />
      ) : (
        <BookmarkIcon 
          className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} 
        />
      )}
      <span>
        {isLoading 
          ? 'Saving...' 
          : isBookmarked 
            ? 'Saved' 
            : 'Save Judge'
        }
      </span>
    </button>
  )
}