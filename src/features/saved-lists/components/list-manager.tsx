'use client'

import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { renameList } from '@/features/saved-lists/actions/rename-list'
import { deleteList } from '@/features/saved-lists/actions/delete-list'

interface ListManagerProps {
  listId: string
  currentName: string
}

export function ListManager({ listId, currentName }: ListManagerProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)

  async function handleRename() {
    if (!name.trim() || saving) return
    setSaving(true)
    await renameList(listId, name)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="h-8 text-sm max-w-[200px]"
            autoFocus
          />
          <Button size="sm" variant="ghost" disabled={saving} onClick={handleRename} className="h-8 px-2">
            <Check size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-8 px-2">
            <X size={14} />
          </Button>
        </>
      ) : (
        <>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="h-8 px-2">
            <Pencil size={14} />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-destructive hover:text-destructive"
            onClick={() => deleteList(listId)}
          >
            <Trash2 size={14} />
          </Button>
        </>
      )}
    </div>
  )
}
