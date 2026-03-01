'use client'

import { useState, useCallback } from 'react'
import { Bookmark, Check, Loader2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toggleListItem } from '@/features/saved-lists/actions/toggle-list-item'
import { createList } from '@/features/saved-lists/actions/create-list'

interface ListOption {
  id: string
  name: string
}

interface SaveToListButtonProps {
  postId: string
}

export function SaveToListButton({ postId }: SaveToListButtonProps) {
  const [lists, setLists] = useState<ListOption[]>([])
  const [membership, setMembership] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const loadLists = useCallback(async () => {
    if (loaded) return
    setLoading(true)
    try {
      const res = await fetch(`/api/save-lists?postId=${postId}`)
      if (res.ok) {
        const data = await res.json()
        setLists(data.lists ?? [])
        setMembership(new Set(data.membership ?? []))
        setLoaded(true)
      }
    } finally {
      setLoading(false)
    }
  }, [postId, loaded])

  const savedCount = membership.size

  async function handleToggle(listId: string) {
    if (toggling) return
    setToggling(listId)
    const result = await toggleListItem(listId, postId)
    setToggling(null)
    if (result.success) {
      setMembership((prev) => {
        const next = new Set(prev)
        result.data.added ? next.add(listId) : next.delete(listId)
        return next
      })
    }
  }

  async function handleCreate() {
    if (!newName.trim() || creating) return
    setCreating(true)
    const result = await createList(newName)
    setCreating(false)
    if (result.success) {
      const newList = { id: result.data.id, name: newName.trim() }
      setLists((prev) => [newList, ...prev])
      setNewName('')
      await handleToggle(result.data.id)
    }
  }

  return (
    <Popover onOpenChange={(open) => open && loadLists()}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Save to list"
        >
          <Bookmark size={15} className={savedCount > 0 ? 'fill-current' : ''} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2 space-y-1">
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Save to list</p>

        {loading && (
          <div className="flex justify-center py-3">
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && loaded && lists.length === 0 && (
          <p className="px-2 py-1 text-xs text-muted-foreground">No lists yet.</p>
        )}

        {!loading && lists.map((list) => {
          const isIn = membership.has(list.id)
          return (
            <button
              key={list.id}
              type="button"
              onClick={() => handleToggle(list.id)}
              disabled={toggling === list.id}
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              <span className="truncate">{list.name}</span>
              {toggling === list.id ? (
                <Loader2 size={13} className="animate-spin shrink-0" />
              ) : isIn ? (
                <Check size={13} className="shrink-0 text-primary" />
              ) : null}
            </button>
          )
        })}

        <div className="border-t pt-1 mt-1 flex gap-1">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="New list…"
            className="h-7 text-xs"
          />
          <Button
            size="sm"
            variant="ghost"
            disabled={!newName.trim() || creating}
            onClick={handleCreate}
            className="h-7 px-2 text-xs"
          >
            {creating ? <Loader2 size={11} className="animate-spin" /> : 'Add'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
