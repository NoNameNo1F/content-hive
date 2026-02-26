'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { PostCard } from '@/components/shared/post-card'
import { Button } from '@/components/ui/button'
import type { PostWithRelations } from '@/types'

interface FeedListProps {
  initialPosts: PostWithRelations[]
  bookmarkedIds: string[]
  currentUserId?: string | null
  hasMore: boolean
  userId?: string | null
}

export function FeedList({
  initialPosts,
  bookmarkedIds,
  currentUserId,
  hasMore: initialHasMore,
  userId,
}: FeedListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSort = (searchParams.get('sort') as 'recent' | 'popular') ?? 'recent'

  const [posts, setPosts] = useState(initialPosts)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [bookmarked, setBookmarked] = useState(new Set(bookmarkedIds))
  const [isPending, startTransition] = useTransition()

  function handleSortChange(sort: 'recent' | 'popular') {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sort)
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleLoadMore() {
    const nextPage = page + 1
    startTransition(async () => {
      const params = new URLSearchParams()
      if (userId) params.set('userId', userId)
      params.set('page', String(nextPage))
      params.set('sortBy', currentSort)

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
    <div className="space-y-6">
      {/* Sort toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort:</span>
        <Button
          variant={currentSort === 'recent' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleSortChange('recent')}
        >
          Recent
        </Button>
        <Button
          variant={currentSort === 'popular' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleSortChange('popular')}
        >
          Popular
        </Button>
      </div>

      {/* Post grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isBookmarked={bookmarked.has(post.id)}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isPending}
          >
            {isPending ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}
