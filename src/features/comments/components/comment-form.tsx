'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createComment } from '@/features/comments/actions/create-comment'

interface CommentFormProps {
  postId: string
  parentId?: string | null
  placeholder?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function CommentForm({
  postId,
  parentId,
  placeholder = 'Write a comment…',
  onSuccess,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    const result = await createComment(postId, content, parentId)
    setSubmitting(false)
    if (!result.success) {
      setError(result.error)
    } else {
      setContent('')
      onSuccess?.()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={2}
        maxLength={1000}
        disabled={submitting}
        className="resize-none text-sm"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={!content.trim() || submitting}>
          {submitting ? 'Posting…' : 'Post'}
        </Button>
      </div>
    </form>
  )
}
