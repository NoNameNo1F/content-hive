'use client'

import { CommentCard } from './comment-card'
import type { CommentRow } from '@/features/comments/queries/get-comments'

interface Thread {
  comment: CommentRow
  replies: CommentRow[]
}

interface CommentListProps {
  comments: CommentRow[]
  postId: string
  currentUserId: string | null
  onReplySuccess?: () => void
}

export function CommentList({ comments, postId, currentUserId, onReplySuccess }: CommentListProps) {
  // Group flat list into top-level threads
  const topLevel = comments.filter((c) => !c.parent_id)
  const replies = comments.filter((c) => !!c.parent_id)

  const threads: Thread[] = topLevel.map((c) => ({
    comment: c,
    replies: replies.filter((r) => r.parent_id === c.id),
  }))

  if (threads.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No comments yet. Be the first!
      </p>
    )
  }

  return (
    <div className="divide-y divide-border">
      {threads.map(({ comment, replies: threadReplies }) => (
        <div key={comment.id}>
          <CommentCard
            comment={comment}
            postId={postId}
            currentUserId={currentUserId}
            onReplySuccess={onReplySuccess}
          />
          {threadReplies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              isReply
            />
          ))}
        </div>
      ))}
    </div>
  )
}
