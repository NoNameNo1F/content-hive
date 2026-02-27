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

/** URL input that:
 *  1. Auto-resolves Douyin short links (v.douyin.com/*) on blur.
 *  2. Auto-fetches OG metadata on blur for link posts.
 */
export function UrlInput({ name, value, onChange, onOgFetch, placeholder }: UrlInputProps) {
  const [isFetching, setIsFetching] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  async function handleBlur() {
    if (!value) return

    let url = value
    try {
      new URL(url) // validate
    } catch {
      return
    }

    setIsFetching(true)
    setHint(null)

    try {
      // ── Step 1: resolve Douyin short links ──────────────────────────────────
      const isDouyinShort = /^https?:\/\/v\.douyin\.com\//i.test(url)
      if (isDouyinShort) {
        setHint('Resolving Douyin link…')
        const res = await fetch(`/api/resolve-url?url=${encodeURIComponent(url)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.url && data.url !== url) {
            url = data.url
            onChange(url)
            setHint('Douyin link resolved ✓')
            setTimeout(() => setHint(null), 2500)
          }
        }
      }

      // ── Step 2: fetch OG metadata for link posts ────────────────────────────
      if (onOgFetch) {
        const og = await fetch(`/api/og?url=${encodeURIComponent(url)}`)
        if (og.ok) {
          const data = await og.json()
          onOgFetch(data)
        }
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
      {(isFetching || hint) && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {hint ?? 'Fetching…'}
        </span>
      )}
    </div>
  )
}
