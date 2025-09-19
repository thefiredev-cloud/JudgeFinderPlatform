'use client'

import { useState, useEffect, useCallback } from 'react'
import { BookmarkIcon, LoaderIcon } from 'lucide-react'
import { useSafeUser, SafeSignInButton } from '@/lib/auth/safe-clerk-components'
import { cn } from '@/lib/utils/index'

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
        <LoaderIcon className="h-5 w-5 animate-spin text-[color:hsl(var(--text-3))]" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <SafeSignInButton mode="modal">
        <button
          className={cn(
            'flex items-center space-x-2 rounded-full border border-border/70 bg-[hsl(var(--bg-1))] px-4 py-2 text-[color:hsl(var(--text-2))] transition-colors hover:text-[color:hsl(var(--text-1))]',
            className,
          )}
        >
          <BookmarkIcon className="h-5 w-5" />
          <span>Save Judge</span>
        </button>
      </SafeSignInButton>
    )
  }

  return (
    <button
      onClick={toggleBookmark}
      disabled={isLoading}
      className={cn(
        'flex items-center space-x-2 rounded-full border px-4 py-2 transition-colors',
        isBookmarked
          ? 'border-[rgba(110,168,254,0.45)] bg-[rgba(110,168,254,0.18)] text-[color:hsl(var(--text-1))] hover:bg-[rgba(110,168,254,0.24)]'
          : 'border-border/70 bg-[hsl(var(--bg-1))] text-[color:hsl(var(--text-2))] hover:text-[color:hsl(var(--text-1))]',
        className,
      )}
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
