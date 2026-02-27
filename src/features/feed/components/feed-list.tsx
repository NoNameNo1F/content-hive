'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { PostCard } from '@/components/shared/post-card'
import { Button } from '@/components/ui/button'
import type { ContentStatus, PostWithRelations } from '@/types'
import type { FeedSortBy } from '@/features/feed/queries/get-feed-posts'

const STATUS_OPTIONS: { value: ContentStatus; label: string; className: string }[] = [
  { value: 'available', label: 'Available', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'in_use',    label: 'In use',    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { value: 'used',      label: 'Used',      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'rejected',  label: 'Rejected',  className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
]

const SORT_OPTIONS: { value: FeedSortBy; label: string; title: string }[] = [
  { value: 'hot',  label: '🔥 Hot',  title: 'Most upvoted' },
  { value: 'new',  label: '🆕 New',  title: 'Most recent' },
  { value: 'top',  label: '⭐ Top',  title: 'Most saved' },
]

interface FeedListProps {
  initialPosts: PostWithRelations[]
  bookmarkedIds: string[]
  initialUserVotes: Record<string, 1 | -1>
  currentUserId?: string | null
  hasMore: boolean
  userId?: string | null
  initialSort?: FeedSortBy
  initialStatus?: ContentStatus
}

export function FeedList({
  initialPosts,
  bookmarkedIds,
  initialUserVotes,
  currentUserId,
  hasMore: initialHasMore,
  userId,
  initialSort = 'hot',
  initialStatus,
}: FeedListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSort = (searchParams.get('sort') as FeedSortBy | null) ?? initialSort
  const currentStatus = (searchParams.get('status') as ContentStatus | null) ?? initialStatus ?? null

  const [posts, setPosts] = useState(initialPosts)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [bookmarked] = useState(new Set(bookmarkedIds))
  const [userVotes] = useState<Record<string, 1 | -1>>(initialUserVotes)
  const [isPending, startTransition] = useTransition()

  function handleSortChange(sort: FeedSortBy) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sort)
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleStatusFilter(s: ContentStatus) {
    const params = new URLSearchParams(searchParams.toString())
    if (currentStatus === s) {
      params.delete('status')
    } else {
      params.set('status', s)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleLoadMore() {
    const nextPage = page + 1
    startTransition(async () => {
      const params = new URLSearchParams()
      if (userId) params.set('userId', userId)
      params.set('page', String(nextPage))
      params.set('sortBy', currentSort)
      if (currentStatus) params.set('status', currentStatus)

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
      {/* Sort + status filter row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Sort tabs */}
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {SORT_OPTIONS.map(({ value, label, title }) => (
            <Button
              key={value}
              variant={currentSort === value ? 'default' : 'ghost'}
              size="sm"
              title={title}
              onClick={() => handleSortChange(value)}
              className="h-7 px-2 text-xs"
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Status chips */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {STATUS_OPTIONS.map(({ value, label, className }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleStatusFilter(value)}
              className={`rounded-full px-2 py-0.5 text-xs font-medium transition-opacity ${className} ${currentStatus === value ? 'ring-2 ring-offset-1 ring-current' : 'opacity-60 hover:opacity-100'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Post grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isBookmarked={bookmarked.has(post.id)}
            currentUserId={currentUserId}
            userVote={userVotes[post.id] ?? null}
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
