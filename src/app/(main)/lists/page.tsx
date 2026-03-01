import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getUserLists } from '@/features/saved-lists/queries/get-user-lists'
import { CreateListDialog } from '@/features/saved-lists/components/create-list-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { Layers } from 'lucide-react'

export default async function ListsPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lists = await getUserLists(user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Lists</h1>
          <p className="text-sm text-muted-foreground">{lists.length} list{lists.length !== 1 ? 's' : ''}</p>
        </div>
        <CreateListDialog />
      </div>

      {lists.length === 0 ? (
        <EmptyState
          title="No lists yet"
          description="Create a list to organise posts into collections."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/lists/${list.id}`}
              className="flex items-center gap-3 rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <Layers size={18} className="text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-medium leading-snug truncate">{list.name}</p>
                <p className="text-xs text-muted-foreground">
                  {list.item_count} post{list.item_count !== 1 ? 's' : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
