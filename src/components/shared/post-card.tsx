'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Layers, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BookmarkButton } from '@/components/shared/bookmark-button'
import { SaveToListButton } from '@/features/saved-lists/components/save-to-list-button'
import { VideoEmbed } from '@/features/content/components/video-embed'
import { VoteButtons } from '@/features/content/components/vote-buttons'
import { cn } from '@/lib/utils'
import type { ContentStatus, PostWithRelations } from '@/types'

const STATUS_STYLES: Record<ContentStatus, string> = {
  available:   'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  unavailable: 'bg-muted text-muted-foreground',
}

const STATUS_LABELS: Record<ContentStatus, string> = {
  available:   'Available',
  unavailable: 'Unavailable',
}

function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

interface PostCardProps {
  post: PostWithRelations
  isBookmarked?: boolean
  currentUserId?: string | null
  userVote?: 1 | -1 | null
}

export function PostCard({ post, isBookmarked = false, currentUserId, userVote = null }: PostCardProps) {
  const [showVideo, setShowVideo] = useState(false)

  const author = post.profiles
  const tags = post.post_tags.map((t) => t.tag)
  const isVideo = post.type === 'video' && !!post.url
  const isUnavailable = post.status === 'unavailable'
  // Cast to access new columns (types regenerated but PostWithRelations uses PostRow spread)
  const hasShoppingCart = (post as { has_shopping_cart?: boolean }).has_shopping_cart ?? false
  const isCarousel = (post as { is_carousel?: boolean }).is_carousel ?? false

  return (
    <article className={cn(
      'group relative rounded-lg border bg-card text-card-foreground transition-shadow hover:shadow-md',
      isUnavailable && 'opacity-50 grayscale-30'
    )}>
      {/* Top-right overlay badges */}
      {(isUnavailable || hasShoppingCart) && (
        <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
          {isUnavailable && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground shadow-sm">
              Unavailable
            </span>
          )}
          {hasShoppingCart && (
            <span className="flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 shadow-sm">
              <ShoppingCart size={10} />
              Shop
            </span>
          )}
        </div>
      )}

      {/* Video preview — inline playable; carousel gets static treatment */}
      {isVideo && !isCarousel && (
        showVideo ? (
          <div className="relative rounded-t-lg overflow-hidden">
            <VideoEmbed url={post.url!} />
            <button
              onClick={() => setShowVideo(false)}
              type="button"
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              aria-label="Close video"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowVideo(true)}
            type="button"
            className="group/play relative w-full overflow-hidden rounded-t-lg bg-muted"
            aria-label="Play video"
          >
            {post.thumbnail ? (
              <div className="relative aspect-video w-full">
                <Image
                  src={post.thumbnail}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform group-hover/play:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center bg-black/10" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover/play:bg-black/40">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover/play:scale-110">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 translate-x-0.5 text-black">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </button>
        )
      )}

      {/* Carousel: static thumbnail with overlay icon + CTA */}
      {isVideo && isCarousel && (
        <div className="relative rounded-t-lg overflow-hidden bg-muted">
          {post.thumbnail ? (
            <div className="relative aspect-video w-full">
              <Image
                src={post.thumbnail}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center bg-black/10" />
          )}
          {/* Carousel icon bottom-right */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5">
            <Layers size={12} className="text-white" />
            <span className="text-xs text-white">Carousel</span>
          </div>
          {/* View carousel CTA */}
          {post.url && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-black shadow-lg hover:bg-white"
                onClick={(e) => e.stopPropagation()}
              >
                View carousel →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Static thumbnail for non-video posts */}
      {!isVideo && post.thumbnail && (
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
          <Image
            src={post.thumbnail}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}

      <div className="space-y-3 p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="shrink-0 text-xs capitalize">
                {post.type}
              </Badge>
              {post.visibility === 'team' && (
                <Badge variant="outline" className="shrink-0 text-xs">Team</Badge>
              )}
            </div>
            <Link
              href={`/post/${post.id}`}
              className="line-clamp-2 font-semibold leading-snug hover:underline"
            >
              {post.title}
            </Link>
          </div>

          {currentUserId && (
            <div className="shrink-0 flex items-center gap-1">
              <SaveToListButton postId={post.id} />
              <BookmarkButton postId={post.id} initialBookmarked={isBookmarked} />
            </div>
          )}
        </div>

        {/* Description */}
        {post.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{post.description}</p>
        )}

        {/* Hashtags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 5).map((tag) => (
              <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`}>
                <Badge variant="outline" className="text-xs hover:bg-accent">
                  #{tag}
                </Badge>
              </Link>
            ))}
            {tags.length > 5 && (
              <span className="text-xs text-muted-foreground">+{tags.length - 5} more</span>
            )}
          </div>
        )}

        {/* Creator handle */}
        {post.creator_handle && (
          <p className="text-xs text-muted-foreground">
            Creator: <span className="font-medium">{post.creator_handle}</span>
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {currentUserId && (
              <VoteButtons
                postId={post.id}
                initialVotesCount={post.votes_count ?? 0}
                initialUserVote={userVote}
              />
            )}
            {!currentUserId && (
              <span className="tabular-nums">
                {post.votes_count ?? 0} vote{(post.votes_count ?? 0) !== 1 ? 's' : ''}
              </span>
            )}
            <span>by {author?.username ?? 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={post.status} />
            <span>{post.saves_count} save{post.saves_count !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-0.5">
              <MessageCircle size={11} />
              {(post as { comments_count?: number }).comments_count ?? 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
