'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'

interface OgData {
  title?: string | null
  description?: string | null
  image?: string | null
}

interface UrlInputProps {
  name: string
  value: string
  onChange: (value: string) => void
  /** Called with OG data after a link URL is blurred (link posts only) */
  onOgFetch?: (data: OgData) => void
  placeholder?: string
}

/** URL input that auto-fetches OG metadata on blur for link posts. */
export function UrlInput({ name, value, onChange, onOgFetch, placeholder }: UrlInputProps) {
  const [isFetching, setIsFetching] = useState(false)

  async function handleBlur() {
    if (!onOgFetch || !value) return
    try {
      new URL(value) // skip if not a valid URL
    } catch {
      return
    }

    setIsFetching(true)
    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(value)}`)
      if (res.ok) {
        const data = await res.json()
        onOgFetch(data)
      }
    } finally {
      setIsFetching(false)
    }
  }

  return (
    <div className="relative">
      <Input
        name={name}
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder ?? 'https://'}
      />
      {isFetching && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          Fetching…
        </span>
      )}
    </div>
  )
}
