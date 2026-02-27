'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { updatePostStatus } from '@/features/content/actions/update-post-status'
import { VoteButtons } from '@/features/content/components/vote-buttons'
import { Badge } from '@/components/ui/badge'
import type { ContentStatus, PostWithRelations } from '@/types'

const STATUS_SEQUENCE: ContentStatus[] = ['available', 'in_use', 'used', 'rejected']

const NEXT_LABEL: Partial<Record<ContentStatus, string>> = {
  available: 'Mark in use →',
  in_use:    'Mark used →',
  used:      'Mark rejected →',
}

const PREV_LABEL: Partial<Record<ContentStatus, string>> = {
  in_use:   '← Back to available',
  used:     '← Back to in use',
  rejected: '← Back to used',
}

interface BoardCardProps {
  post: PostWithRelations
  currentUserId: string | null
  userVote?: 1 | -1 | null
}

export function BoardCard({ post, currentUserId, userVote = null }: BoardCardProps) {
  const [isPending, startTransition] = useTransition()
  const isOwner = currentUserId === post.user_id
  const idx = STATUS_SEQUENCE.indexOf(post.status as ContentStatus)

  function moveTo(status: ContentStatus) {
    startTransition(() => {
      updatePostStatus(post.id, status)
    })
  }

  return (
    <div className={`rounded-lg border bg-card p-3 space-y-2 text-sm transition-opacity ${isPending ? 'opacity-50' : ''}`}>
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

      {/* Move buttons — only for owner */}
      {isOwner && (
        <div className="flex flex-wrap gap-1 pt-1">
          {idx > 0 && PREV_LABEL[post.status as ContentStatus] && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => moveTo(STATUS_SEQUENCE[idx - 1])}
              className="rounded px-2 py-0.5 text-xs bg-muted hover:bg-muted/80 transition-colors"
            >
              {PREV_LABEL[post.status as ContentStatus]}
            </button>
          )}
          {idx < STATUS_SEQUENCE.length - 1 && NEXT_LABEL[post.status as ContentStatus] && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => moveTo(STATUS_SEQUENCE[idx + 1])}
              className="rounded px-2 py-0.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {NEXT_LABEL[post.status as ContentStatus]}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
