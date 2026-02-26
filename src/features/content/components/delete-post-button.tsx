'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deletePost } from '@/features/content/actions/delete-post'

interface DeletePostButtonProps {
  postId: string
}

export function DeletePostButton({ postId }: DeletePostButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Delete this post? This cannot be undone.')) return
    startTransition(async () => {
      await deletePost(postId)
    })
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={handleDelete}
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </Button>
  )
}
