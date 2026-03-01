'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowUp, ArrowDown, Share2, Check } from 'lucide-react'
import { VideoEmbed } from '@/features/content/components/video-embed'
import { Button } from '@/components/ui/button'
import { CommentSheet } from '@/features/comments/components/comment-sheet'
import { SaveToListButton } from '@/features/saved-lists/components/save-to-list-button'
import { toggleVote } from '@/features/content/actions/toggle-vote'
import type { PostWithRelations } from '@/types'

// ─── Outlined rail pill button ────────────────────────────────────────────────

interface RailPillProps {
  children: React.ReactNode
  onClick?: () => void
  active?: boolean
  activeClass?: string
  defaultClass?: string
  label: string
  count?: number | string
}

function RailPill({ children, onClick, active, activeClass, defaultClass, label, count }: RailPillProps) {
  const base = 'rounded-2xl border px-2.5 py-1.5 flex flex-col items-center gap-0.5 transition-colors cursor-pointer'
  const colorClass = active
    ? (activeClass ?? 'border-white/40 bg-white/20 text-white')
    : (defaultClass ?? 'border-white/30 bg-black/20 text-white/80 hover:bg-white/10')
  return (
    <button type="button" onClick={onClick} aria-label={label} className={`${base} ${colorClass}`}>
      {children}
      {count !== undefined && (
        <span className="text-[10px] font-medium leading-none">{count}</span>
      )}
    </button>
  )
}

// ─── Single card ─────────────────────────────────────────────────────────────

interface VerticalFeedCardProps {
  post: PostWithRelations
  isBookmarked: boolean
  currentUserId?: string | null
  userVote: 1 | -1 | null
}

function VerticalFeedCard({ post, currentUserId, userVote: initialUserVote }: VerticalFeedCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)

  const [votesCount, setVotesCount] = useState(post.votes_count ?? 0)
  const [upvotes, setUpvotes] = useState(
    Math.max(0, (post.votes_count ?? 0) > 0 ? (post.votes_count ?? 0) : 0)
  )
  const [downvotes, setDownvotes] = useState(0)
  const [userVote, setUserVote] = useState<1 | -1 | null>(initialUserVote)
  const [copied, setCopied] = useState(false)
  const [, startTransition] = useTransition()

  const isVideo = post.type === 'video' && !!post.url
  const tiktokId = post.url?.match(/tiktok\.com\/.*\/video\/(\d+)/)?.[1] ?? null
  const author = post.profiles as { id?: string; username?: string; avatar_url?: string | null } | null
  const tags = (post.post_tags as Array<{ tag: string }> | null) ?? []
  const commentsCount = (post as { comments_count?: number }).comments_count ?? 0

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsActive(entry.isIntersecting),
      { threshold: 0.85 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function handleVote(direction: 1 | -1) {
    const prevVote = userVote
    const prevVotes = votesCount
    const prevUp = upvotes
    const prevDown = downvotes

    if (userVote === direction) {
      setUserVote(null)
      setVotesCount(votesCount - direction)
      if (direction === 1) setUpvotes((v) => Math.max(0, v - 1))
      else setDownvotes((v) => Math.max(0, v - 1))
    } else if (userVote !== null) {
      setUserVote(direction)
      setVotesCount(votesCount + direction * 2)
      if (direction === 1) { setUpvotes((v) => v + 1); setDownvotes((v) => Math.max(0, v - 1)) }
      else { setDownvotes((v) => v + 1); setUpvotes((v) => Math.max(0, v - 1)) }
    } else {
      setUserVote(direction)
      setVotesCount(votesCount + direction)
      if (direction === 1) setUpvotes((v) => v + 1)
      else setDownvotes((v) => v + 1)
    }

    startTransition(async () => {
      const result = await toggleVote(post.id, direction)
      if (!result.success) {
        setUserVote(prevVote)
        setVotesCount(prevVotes)
        setUpvotes(prevUp)
        setDownvotes(prevDown)
      } else {
        setVotesCount(result.data.votesCount)
        setUserVote(result.data.userVote)
      }
    })
  }

  function handleShare() {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const mediaContent = isVideo ? (
    isActive ? (
      tiktokId ? (
        <iframe
          src={`https://www.tiktok.com/embed/v2/${tiktokId}?autoplay=1`}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          allowFullScreen
          title={post.title}
        />
      ) : (
        <VideoEmbed url={post.url!} autoplay />
      )
    ) : (
      <div className="absolute inset-0 flex items-center justify-center bg-muted">
        {post.thumbnail ? (
          <Image src={post.thumbnail} alt={post.title} fill className="object-contain" />
        ) : (
          <span className="text-muted-foreground text-sm">Scroll to play</span>
        )}
      </div>
    )
  ) : post.thumbnail ? (
    <div className="absolute inset-0">
      <Image src={post.thumbnail} alt={post.title} fill className="object-contain" />
    </div>
  ) : (
    <div className="absolute inset-0 flex items-center justify-center bg-muted">
      <span className="text-muted-foreground text-sm capitalize">{post.type}</span>
    </div>
  )

  // Shared pill style for comment + save triggers in the rail
  const railTriggerClass = 'rounded-2xl border border-white/30 bg-black/20 text-white/80 hover:bg-white/10 h-auto px-2.5 py-1.5 flex flex-col items-center gap-0.5 w-full'

  return (
    <div ref={ref} className="relative h-full w-full max-w-lg overflow-hidden rounded-xl bg-black">
      {/* Media layer */}
      {mediaContent}

      {/* Dark bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

      {/* Bottom overlay: title + handle + hashtags */}
      <div className="absolute bottom-4 left-3 right-16 space-y-1 z-10">
        {author?.username && (
          <p className="text-white/70 text-xs">@{author.username}</p>
        )}
        <Link href={`/post/${post.id}`} className="block">
          <p className="text-white text-sm font-semibold leading-snug line-clamp-2 hover:underline">
            {post.title}
          </p>
        </Link>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map(({ tag }) => (
              <Link
                key={tag}
                href={`/tag/${encodeURIComponent(tag)}`}
                className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white hover:bg-white/30"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Right action rail — outlined pills */}
      <div className="absolute right-3 bottom-20 flex flex-col gap-3 items-center z-10 w-12">
        {/* Upvote */}
        <RailPill
          label="Upvote"
          count={upvotes}
          onClick={() => handleVote(1)}
          active={userVote === 1}
          activeClass="border-blue-400/80 bg-blue-500/25 text-blue-300"
          defaultClass="border-blue-400/40 bg-black/20 text-blue-200/70 hover:bg-blue-500/15"
        >
          <ArrowUp size={16} />
        </RailPill>

        {/* Downvote */}
        <RailPill
          label="Downvote"
          count={downvotes}
          onClick={() => handleVote(-1)}
          active={userVote === -1}
          activeClass="border-red-400/80 bg-red-500/25 text-red-300"
          defaultClass="border-red-400/40 bg-black/20 text-red-200/70 hover:bg-red-500/15"
        >
          <ArrowDown size={16} />
        </RailPill>

        {/* Comments — use CommentSheet with overridden trigger style */}
        <CommentSheet
          postId={post.id}
          count={commentsCount}
          currentUserId={currentUserId ?? null}
          triggerClassName={railTriggerClass}
        />

        {/* Save to list */}
        <SaveToListButton postId={post.id} triggerClassName={railTriggerClass} />

        {/* Share */}
        <RailPill
          label="Share"
          onClick={handleShare}
          active={copied}
          activeClass="border-green-400/80 bg-green-500/25 text-green-300"
          defaultClass="border-white/30 bg-black/20 text-white/80 hover:bg-white/10"
          count={copied ? 'Copied' : 'Share'}
        >
          {copied ? <Check size={16} /> : <Share2 size={16} />}
        </RailPill>
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
    <div
      className="h-[calc(100vh-8rem)] overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
    >
      {posts.map((post) => (
        <div
          key={post.id}
          className="h-[calc(100vh-8rem)] snap-start flex items-center justify-center px-2"
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
