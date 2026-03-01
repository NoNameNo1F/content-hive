'use client'

import { useState, useCallback } from 'react'
import { MessageCircle } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { CommentList } from './comment-list'
import { CommentForm } from './comment-form'
import type { CommentRow } from '@/features/comments/queries/get-comments'

interface CommentSheetProps {
  postId: string
  count: number
  currentUserId: string | null
  triggerClassName?: string
}

export function CommentSheet({ postId, count, currentUserId, triggerClassName }: CommentSheetProps) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<CommentRow[]>([])
  const [loading, setLoading] = useState(false)

  const loadComments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/comments?postId=${postId}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } finally {
      setLoading(false)
    }
  }, [postId])

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen) loadComments()
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className={triggerClassName ?? 'gap-1.5 text-muted-foreground hover:text-foreground'}>
          <MessageCircle size={15} />
          <span className="text-xs">{count}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[60vh] flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle className="text-base">
            Comments {comments.length > 0 && `(${comments.length})`}
          </SheetTitle>
        </SheetHeader>

        {currentUserId && (
          <div className="shrink-0 border-b pb-3">
            <CommentForm postId={postId} onSuccess={loadComments} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-muted-foreground">Loading…</span>
            </div>
          ) : (
            <CommentList
              comments={comments}
              postId={postId}
              currentUserId={currentUserId}
              onReplySuccess={loadComments}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
