'use client'

import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MAX_TAGS_PER_POST } from '@/lib/constants'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

/** Multi-tag input: type a tag, press Enter or comma to add. Click × to remove. */
export function TagInput({ tags, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS_PER_POST) return
    onChange([...tags, tag])
    setInputValue('')
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div
      className="flex min-h-10 flex-wrap gap-1.5 rounded-md border bg-background px-3 py-2 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Hidden inputs for form submission */}
      {tags.map((tag) => (
        <input key={tag} type="hidden" name="tags" value={tag} />
      ))}

      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 text-xs">
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
            className="rounded-full hover:text-destructive"
            aria-label={`Remove tag ${tag}`}
          >
            ×
          </button>
        </Badge>
      ))}

      {tags.length < MAX_TAGS_PER_POST && (
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(inputValue)}
          placeholder={tags.length === 0 ? 'Add tags (press Enter)' : ''}
          className="h-auto flex-1 min-w-24 border-0 p-0 shadow-none focus-visible:ring-0 text-sm"
        />
      )}
    </div>
  )
}
