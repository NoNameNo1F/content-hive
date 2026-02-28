'use client'

import { useActionState, useState } from 'react'
import { saveInterests } from '@/features/auth/actions/save-interests'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SUGGESTED_INTEREST_TAGS, CONTENT_TYPE_LABELS, MIN_INTEREST_TAGS, MAX_INTEREST_TAGS } from '@/lib/constants'
import type { ActionResult } from '@/types'

interface InterestSelectorProps {
  initialSelected?: string[]
}

export function InterestSelector({ initialSelected = [] }: InterestSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    saveInterests,
    null
  )

  function toggleTag(tag: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) {
        next.delete(tag)
      } else if (next.size < MAX_INTEREST_TAGS) {
        next.add(tag)
      }
      return next
    })
  }

  const count = selected.size
  const canSubmit = count >= MIN_INTEREST_TAGS && count <= MAX_INTEREST_TAGS

  return (
    <form
      action={(formData) => {
        selected.forEach((tag) => formData.append('tags', tag))
        action(formData)
      }}
      className="space-y-6"
    >
      {state && !state.success && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <p className="text-sm text-muted-foreground">
        Selected: <span className="font-medium text-foreground">{count}</span> /{' '}
        {MAX_INTEREST_TAGS} (minimum {MIN_INTEREST_TAGS})
      </p>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_INTEREST_TAGS.map((tag) => {
          const isSelected = selected.has(tag)
          const isDisabled = !isSelected && count >= MAX_INTEREST_TAGS
          return (
            <button
              key={CONTENT_TYPE_LABELS[tag] ?? tag}
              type="button"
              onClick={() => toggleTag(tag)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Badge
                variant={isSelected ? 'default' : 'outline'}
                className="text-sm transition-colors"
              >
                {CONTENT_TYPE_LABELS[tag] ?? tag}
              </Badge>
            </button>
          )
        })}
      </div>

      <Button type="submit" disabled={!canSubmit || isPending} className="w-full">
        {isPending ? 'Saving…' : 'Continue to feed'}
      </Button>
    </form>
  )
}
