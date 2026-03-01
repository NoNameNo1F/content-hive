'use client'

import { useState, useTransition } from 'react'
import { VerticalFeed } from '@/features/feed/components/vertical-feed'
import type { PostWithRelations } from '@/types'

interface FeedListProps {
  initialPosts:     PostWithRelations[]
  bookmarkedIds:    string[]
  initialUserVotes: Record<string, 1 | -1>
  currentUserId?:   string | null
  hasMore:          boolean
  userId?:          string | null
}

export function FeedList({
  initialPosts,
  bookmarkedIds,
  initialUserVotes,
  currentUserId,
  hasMore: initialHasMore,
  userId,
}: FeedListProps) {
  const [posts, setPosts]     = useState(initialPosts)
  const [page, setPage]       = useState(0)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [userVotes]           = useState<Record<string, 1 | -1>>(initialUserVotes)
  const [isPending, startTransition] = useTransition()

  function handleLoadMore() {
    const nextPage = page + 1
    startTransition(async () => {
      const params = new URLSearchParams()
      if (userId) params.set('userId', userId)
      params.set('page', String(nextPage))
      params.set('sortBy', 'hot')

      const res = await fetch(`/api/feed?${params.toString()}`)
      if (!res.ok) return

      const data: PostWithRelations[] = await res.json()
      setPosts((prev) => [...prev, ...data])
      setPage(nextPage)
      setHasMore(data.length === 20)
    })
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <p className="text-sm">No posts yet.</p>
        {userId && (
          <p className="mt-1 text-xs">
            Try updating your interests or check back later.
          </p>
        )}
      </div>
    )
  }

  return (
    <VerticalFeed
      posts={posts}
      bookmarkedIds={bookmarkedIds}
      userVotes={userVotes}
      currentUserId={currentUserId}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      isLoadingMore={isPending}
    />
  )
}
