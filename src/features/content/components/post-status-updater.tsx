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
  available: 'Available',
  in_use:    'In use',
  used:      'Used',
  rejected:  'Rejected',
}

const STATUS_STYLES: Record<ContentStatus, string> = {
  available: 'text-green-700 dark:text-green-400',
  in_use:    'text-yellow-700 dark:text-yellow-400',
  used:      'text-blue-700 dark:text-blue-400',
  rejected:  'text-red-700 dark:text-red-400',
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
