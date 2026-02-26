'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { SEARCH_MIN_QUERY_LENGTH } from '@/lib/constants'

export function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.length >= SEARCH_MIN_QUERY_LENGTH) {
        params.set('q', value)
      } else {
        params.delete('q')
      }
      // Reset to first page on new search
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Input
      type="search"
      placeholder="Search posts…"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="w-full"
      aria-label="Search"
    />
  )
}
