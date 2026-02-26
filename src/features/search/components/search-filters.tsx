'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SUGGESTED_INTEREST_TAGS } from '@/lib/constants'
import type { Category } from '@/types'

interface SearchFiltersProps {
  categories: Category[]
}

export function SearchFilters({ categories }: SearchFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeTags = searchParams.getAll('tags')
  const activeCategory = searchParams.get('categoryId') ?? ''

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  function toggleTag(tag: string) {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.getAll('tags')
    if (current.includes(tag)) {
      // Remove all 'tags' params and re-add without this tag
      params.delete('tags')
      current.filter((t) => t !== tag).forEach((t) => params.append('tags', t))
    } else {
      params.append('tags', tag)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Category filter */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Category</p>
          <Select
            value={activeCategory || '_all'}
            onValueChange={(v) => setParam('categoryId', v === '_all' ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tag chips */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Filter by tag</p>
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_INTEREST_TAGS.map((tag) => {
            const active = activeTags.includes(tag)
            return (
              <button key={tag} onClick={() => toggleTag(tag)} type="button">
                <Badge
                  variant={active ? 'default' : 'outline'}
                  className="cursor-pointer text-xs hover:bg-accent"
                >
                  {tag}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
