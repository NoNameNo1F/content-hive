'use client'

import { useState, useTransition } from 'react'
import { toggleVote } from '@/features/content/actions/toggle-vote'

interface VoteButtonsProps {
  postId: string
  initialVotesCount: number
  initialUserVote: 1 | -1 | null
}

export function VoteButtons({ postId, initialVotesCount, initialUserVote }: VoteButtonsProps) {
  const [votesCount, setVotesCount] = useState(initialVotesCount)
  const [userVote, setUserVote] = useState<1 | -1 | null>(initialUserVote)
  const [isPending, startTransition] = useTransition()

  function handleVote(direction: 1 | -1) {
    const prevCount = votesCount
    const prevVote = userVote

    // Optimistic update
    if (userVote === direction) {
      setVotesCount(votesCount - direction)
      setUserVote(null)
    } else if (userVote !== null) {
      // Flip: swing of direction * 2
      setVotesCount(votesCount + direction * 2)
      setUserVote(direction)
    } else {
      setVotesCount(votesCount + direction)
      setUserVote(direction)
    }

    startTransition(async () => {
      const result = await toggleVote(postId, direction)
      if (!result.success) {
        setVotesCount(prevCount)
        setUserVote(prevVote)
      } else {
        setVotesCount(result.data.votesCount)
        setUserVote(result.data.userVote)
      }
    })
  }

  const scoreClass =
    votesCount > 0
      ? 'text-primary'
      : votesCount < 0
        ? 'text-destructive'
        : 'text-muted-foreground'

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => handleVote(1)}
        disabled={isPending}
        aria-label="Upvote"
        className={`rounded p-0.5 transition-colors hover:text-primary disabled:opacity-50 ${
          userVote === 1 ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        ▲
      </button>
      <span className={`min-w-[1.5rem] text-center text-xs font-medium tabular-nums ${scoreClass}`}>
        {votesCount}
      </span>
      <button
        type="button"
        onClick={() => handleVote(-1)}
        disabled={isPending}
        aria-label="Downvote"
        className={`rounded p-0.5 transition-colors hover:text-destructive disabled:opacity-50 ${
          userVote === -1 ? 'text-destructive' : 'text-muted-foreground'
        }`}
      >
        ▼
      </button>
    </div>
  )
}
