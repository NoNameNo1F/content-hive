'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { updatePostStatus } from '@/features/content/actions/update-post-status'
import { VoteButtons } from '@/features/content/components/vote-buttons'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PostWithRelations } from '@/types'

interface BoardCardProps {
  post: PostWithRelations
  currentUserId: string | null
  userVote?: 1 | -1 | null
}

export function BoardCard({ post, currentUserId, userVote = null }: BoardCardProps) {
  const [isPending, startTransition] = useTransition()
  const isOwner = currentUserId === post.user_id
  const isUnavailable = post.status === 'unavailable'

  function toggle() {
    startTransition(() => {
      updatePostStatus(post.id, isUnavailable ? 'available' : 'unavailable')
    })
  }

  return (
    <div className={cn(
      'rounded-lg border bg-card p-3 space-y-2 text-sm transition-opacity',
      isPending && 'opacity-50',
      isUnavailable && 'opacity-60 hover:opacity-90 transition-opacity'
    )}>
      {/* Title */}
      <Link href={`/post/${post.id}`} className="font-medium leading-snug hover:underline line-clamp-2">
        {post.title}
      </Link>

      {/* Type + creator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className="capitalize text-xs">{post.type}</Badge>
        {post.creator_handle && <span>{post.creator_handle}</span>}
      </div>

      {/* Author + votes */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">by {post.profiles?.username ?? 'Unknown'}</p>
        <VoteButtons
          postId={post.id}
          initialVotesCount={post.votes_count ?? 0}
          initialUserVote={userVote}
        />
      </div>

      {/* Toggle button — only for owner */}
      {isOwner && (
        <div className="pt-1">
          <button
            type="button"
            disabled={isPending}
            onClick={toggle}
            className={cn(
              'rounded px-2 py-0.5 text-xs transition-colors',
              isUnavailable
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            {isUnavailable ? 'Restore' : 'Mark unavailable'}
          </button>
        </div>
      )}
    </div>
  )
}
