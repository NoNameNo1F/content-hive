'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { VideoEmbed } from '@/features/content/components/video-embed'
import { PostCard } from '@/components/shared/post-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { PostWithRelations } from '@/types'

// ─── Single card ─────────────────────────────────────────────────────────────

interface VerticalFeedCardProps {
  post: PostWithRelations
  isBookmarked: boolean
  currentUserId?: string | null
  userVote: 1 | -1 | null
}

function VerticalFeedCard({ post, isBookmarked, currentUserId, userVote }: VerticalFeedCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)

  const isVideo = post.type === 'video' && !!post.url

  useEffect(() => {
    const el = ref.current
    if (!el || !isVideo) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsActive(entry.isIntersecting),
      { threshold: 0.6 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isVideo])

  if (isVideo) {
    return (
      <div
        ref={ref}
        className="flex h-full w-full max-w-lg flex-col items-center justify-center gap-3 px-4"
      >
        <div className="w-full overflow-hidden rounded-xl shadow-xl">
          {isActive && <VideoEmbed url={post.url!} autoplay />}
          {!isActive && (
            <div className="flex aspect-video w-full items-center justify-center bg-muted rounded-xl">
              {post.thumbnail ? (
                <Image
                  src={post.thumbnail}
                  alt={post.title}
                  width={480}
                  height={270}
                  className="w-full rounded-xl object-cover"
                />
              ) : (
                <span className="text-muted-foreground text-sm">Scroll to play</span>
              )}
            </div>
          )}
        </div>
        <div className="w-full space-y-1 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="capitalize text-xs">{post.type}</Badge>
            {post.creator_handle && (
              <span className="text-xs text-muted-foreground">@{post.creator_handle}</span>
            )}
          </div>
          <Link href={`/post/${post.id}`} className="block font-semibold leading-snug hover:underline line-clamp-2">
            {post.title}
          </Link>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>▲ {post.votes_count ?? 0}</span>
            <span>{post.saves_count ?? 0} saves</span>
          </div>
        </div>
      </div>
    )
  }

  // Non-video: render standard PostCard centred
  return (
    <div className="flex h-full w-full max-w-lg items-center px-4">
      <div className="w-full">
        <PostCard
          post={post}
          isBookmarked={isBookmarked}
          currentUserId={currentUserId}
          userVote={userVote}
        />
      </div>
    </div>
  )
}

// ─── Sentinel for load-more ───────────────────────────────────────────────────

interface SentinelProps { onVisible: () => void }

function Sentinel({ onVisible }: SentinelProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onVisible()
    }, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [onVisible])
  return <div ref={ref} className="h-4 w-full" />
}

// ─── Vertical feed list ───────────────────────────────────────────────────────

interface VerticalFeedProps {
  posts: PostWithRelations[]
  bookmarkedIds: string[]
  userVotes: Record<string, 1 | -1>
  currentUserId?: string | null
  hasMore: boolean
  onLoadMore: () => void
  isLoadingMore: boolean
}

export function VerticalFeed({
  posts,
  bookmarkedIds,
  userVotes,
  currentUserId,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: VerticalFeedProps) {
  const bookmarked = new Set(bookmarkedIds)

  return (
    <div className="h-[calc(100vh-8rem)] overflow-y-scroll snap-y snap-mandatory">
      {posts.map((post) => (
        <div
          key={post.id}
          className="h-[calc(100vh-8rem)] snap-start flex items-center justify-center"
        >
          <VerticalFeedCard
            post={post}
            isBookmarked={bookmarked.has(post.id)}
            currentUserId={currentUserId}
            userVote={userVotes[post.id] ?? null}
          />
        </div>
      ))}

      {hasMore && (
        <div className="h-[calc(100vh-8rem)] snap-start flex items-center justify-center">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading…' : 'Load more'}
          </Button>
          {!isLoadingMore && <Sentinel onVisible={onLoadMore} />}
        </div>
      )}
    </div>
  )
}
