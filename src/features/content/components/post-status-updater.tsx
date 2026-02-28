'use client'

import { useTransition } from 'react'
import { updatePostStatus } from '@/features/content/actions/update-post-status'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ContentStatus } from '@/types'

const STATUS_LABELS: Record<ContentStatus, string> = {
  available:   'Available',
  unavailable: 'Unavailable',
}

const STATUS_STYLES: Record<ContentStatus, string> = {
  available:   'text-green-700 dark:text-green-400',
  unavailable: 'text-muted-foreground',
}

interface PostStatusUpdaterProps {
  postId: string
  currentStatus: ContentStatus
}

export function PostStatusUpdater({ postId, currentStatus }: PostStatusUpdaterProps) {
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string) {
    startTransition(() => {
      updatePostStatus(postId, value as ContentStatus)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Status:</span>
      <Select value={currentStatus} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className={`h-8 w-36 text-xs font-medium ${STATUS_STYLES[currentStatus]}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(STATUS_LABELS) as ContentStatus[]).map((s) => (
            <SelectItem key={s} value={s} className={`text-xs ${STATUS_STYLES[s]}`}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
