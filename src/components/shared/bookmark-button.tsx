'use client'

import { useState, useTransition } from 'react'
import { toggleBookmark } from '@/features/content/actions/toggle-bookmark'
import { Button } from '@/components/ui/button'

interface BookmarkButtonProps {
  postId: string
  initialBookmarked: boolean
}

export function BookmarkButton({ postId, initialBookmarked }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      // Optimistic update
      setIsBookmarked((prev) => !prev)
      const result = await toggleBookmark(postId)
      if (!result.success) {
        // Revert on error
        setIsBookmarked((prev) => !prev)
      }
    })
  }

  return (
    <Button
      variant={isBookmarked ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Save post'}
    >
      {isBookmarked ? 'Saved' : 'Save'}
    </Button>
  )
}
