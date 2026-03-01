'use client'

import { useState } from 'react'
import { Trash2, CornerDownRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteComment } from '@/features/comments/actions/delete-comment'
import { CommentForm } from './comment-form'
import type { CommentRow } from '@/features/comments/queries/get-comments'

interface CommentCardProps {
  comment: CommentRow
  postId: string
  currentUserId: string | null
  isReply?: boolean
  onReplySuccess?: () => void
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function CommentCard({
  comment,
  postId,
  currentUserId,
  isReply = false,
  onReplySuccess,
}: CommentCardProps) {
  const [showReply, setShowReply] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOwner = currentUserId === comment.user_id
  const username = comment.profiles?.username ?? 'Unknown'

  async function handleDelete() {
    setDeleting(true)
    await deleteComment(comment.id, postId)
    setDeleting(false)
  }

  return (
    <div className={isReply ? 'pl-8 border-l border-border' : ''}>
      <div className="flex items-start gap-2 py-2">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{username}</span>
            <span>{relativeTime(comment.created_at)}</span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          {!isReply && currentUserId && (
            <button
              type="button"
              onClick={() => setShowReply((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CornerDownRight size={11} />
              Reply
            </button>
          )}
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
            aria-label="Delete comment"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {showReply && (
        <div className="pl-8 border-l border-border pb-2">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            placeholder={`Reply to ${username}…`}
            onSuccess={() => {
              setShowReply(false)
              onReplySuccess?.()
            }}
            onCancel={() => setShowReply(false)}
          />
        </div>
      )}
    </div>
  )
}
