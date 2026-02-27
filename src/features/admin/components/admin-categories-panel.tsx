'use client'

import { useActionState, useOptimistic, useTransition } from 'react'
import { createCategory, deleteCategory } from '@/features/admin/actions/manage-categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ActionResult, Category } from '@/types'

interface AdminCategoriesPanelProps {
  initialCategories: Category[]
}

export function AdminCategoriesPanel({ initialCategories }: AdminCategoriesPanelProps) {
  const [categories, setOptimisticCategories] = useOptimistic(
    initialCategories,
    (current: Category[], action: { type: 'delete'; id: string } | { type: 'add'; category: Category }) => {
      if (action.type === 'delete') return current.filter((c) => c.id !== action.id)
      return [...current, action.category]
    }
  )

  const [state, formAction, isPending] = useActionState<ActionResult<Category> | null, FormData>(
    createCategory,
    null
  )

  const [, startTransition] = useTransition()

  function handleDelete(categoryId: string) {
    startTransition(async () => {
      setOptimisticCategories({ type: 'delete', id: categoryId })
      await deleteCategory(categoryId)
    })
  }

  return (
    <div className="space-y-6">
      {/* Add category form */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <h2 className="font-semibold">Add category</h2>
        <form action={formAction} className="flex gap-2">
          <Input
            name="name"
            placeholder="Category name"
            className="max-w-xs"
            required
          />
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Adding…' : 'Add'}
          </Button>
        </form>
        {state && !state.success && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state?.success && (
          <p className="text-sm text-green-600">Category added.</p>
        )}
      </div>

      {/* Category list */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{categories.length} categories</p>
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
          >
            <div className="space-y-0.5">
              <p className="font-medium">{cat.name}</p>
              <p className="text-xs text-muted-foreground">/{cat.slug}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(cat.id)}
            >
              Delete
            </Button>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        )}
      </div>
    </div>
  )
}
