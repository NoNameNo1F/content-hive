import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getBoardPosts } from '@/features/board/queries/get-board-posts'
import { BoardCard } from '@/features/board/components/board-card'

export const metadata = { title: 'Content Board — ContentHive' }

const COLUMNS = [
  { status: 'available' as const, label: 'Available',  headerClass: 'border-green-300  bg-green-50  dark:border-green-800  dark:bg-green-950/30' },
  { status: 'in_use'   as const, label: 'In use',     headerClass: 'border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30' },
  { status: 'used'     as const, label: 'Used',       headerClass: 'border-blue-300   bg-blue-50   dark:border-blue-800   dark:bg-blue-950/30'   },
  { status: 'rejected' as const, label: 'Rejected',   headerClass: 'border-red-300    bg-red-50    dark:border-red-800    dark:bg-red-950/30'    },
]

export default async function BoardPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const board = await getBoardPosts()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Content Board</h1>
        <p className="text-muted-foreground">
          Track your content through the workflow — click the buttons on a card to move it forward or back.
        </p>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map(({ status, label, headerClass }) => {
          const posts = board[status]
          return (
            <div key={status} className="flex flex-col gap-3">
              {/* Column header */}
              <div className={`rounded-lg border px-3 py-2 ${headerClass}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {posts.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 min-h-[120px]">
                {posts.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    No content here
                  </div>
                ) : (
                  posts.map((post) => (
                    <BoardCard key={post.id} post={post} currentUserId={user.id} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
