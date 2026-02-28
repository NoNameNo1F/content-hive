import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getBoardPosts } from '@/features/board/queries/get-board-posts'
import { getUserVotes } from '@/features/content/queries/get-user-votes'
import { BoardCard } from '@/features/board/components/board-card'

export const metadata = { title: 'Content Board — ContentHive' }

export default async function BoardPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const board = await getBoardPosts()

  const allPosts = [...board.available, ...board.unavailable]
  const userVotes = await getUserVotes(user.id, allPosts.map((p) => p.id))

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Content Board</h1>
        <p className="text-muted-foreground">
          Track content availability. Vote to surface the best ideas.
        </p>
      </div>

      {/* 2-column Kanban */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Available column */}
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Available</span>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {board.available.length}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 min-h-30">
            {board.available.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No content here
              </div>
            ) : (
              board.available.map((post) => (
                <BoardCard
                  key={post.id}
                  post={post}
                  currentUserId={user.id}
                  userVote={userVotes[post.id] ?? null}
                />
              ))
            )}
          </div>
        </div>

        {/* Unavailable column */}
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Unavailable</span>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {board.unavailable.length}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 min-h-30">
            {board.unavailable.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No content here
              </div>
            ) : (
              board.unavailable.map((post) => (
                <BoardCard
                  key={post.id}
                  post={post}
                  currentUserId={user.id}
                  userVote={userVotes[post.id] ?? null}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
