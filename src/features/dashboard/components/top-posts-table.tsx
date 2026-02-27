import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { TopPost } from '@/features/dashboard/queries/get-dashboard-stats'

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-green-100  text-green-800  dark:bg-green-900  dark:text-green-200',
  in_use:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  used:      'bg-blue-100   text-blue-800   dark:bg-blue-900   dark:text-blue-200',
  rejected:  'bg-red-100    text-red-800    dark:bg-red-900    dark:text-red-200',
}

interface TopPostsTableProps {
  title: string
  posts: TopPost[]
  sortKey: 'votes_count' | 'saves_count'
}

export function TopPostsTable({ title, posts, sortKey }: TopPostsTableProps) {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="divide-y">
        {posts.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No posts yet</p>
        )}
        {posts.map((post, i) => (
          <div key={post.id} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/30 transition-colors">
            <span className="w-5 text-xs text-muted-foreground tabular-nums text-right shrink-0">
              {i + 1}
            </span>
            <Link
              href={`/post/${post.id}`}
              className="flex-1 text-sm font-medium line-clamp-1 hover:underline"
            >
              {post.title}
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className="capitalize text-[10px] h-4 px-1.5">
                {post.type}
              </Badge>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLES[post.status] ?? ''}`}>
                {post.status.replace('_', ' ')}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground w-12 text-right">
                {sortKey === 'votes_count'
                  ? `▲ ${post.votes_count}`
                  : `★ ${post.saves_count}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
