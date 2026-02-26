import { PostCard } from '@/components/shared/post-card'
import type { PostWithRelations } from '@/types'

interface SearchResultsProps {
  posts: PostWithRelations[]
  total: number
  bookmarkedIds: string[]
  currentUserId?: string | null
  query?: string
}

export function SearchResults({
  posts,
  total,
  bookmarkedIds,
  currentUserId,
  query,
}: SearchResultsProps) {
  const bookmarkedSet = new Set(bookmarkedIds)

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <p className="text-sm">
          {query
            ? `No results for "${query}". Try different keywords or remove some filters.`
            : 'No posts match the selected filters.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {total} result{total !== 1 ? 's' : ''}
        {query ? ` for "${query}"` : ''}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isBookmarked={bookmarkedSet.has(post.id)}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  )
}
