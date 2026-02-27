import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getPostsByTag } from '@/features/content/queries/get-posts-by-tag'
import { PostCard } from '@/components/shared/post-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface TagPageProps {
  params: Promise<{ name: string }>
  searchParams: Promise<{ sort?: string }>
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { name } = await params
  const { sort } = await searchParams
  const sortBy = sort === 'popular' ? 'popular' : 'recent'

  // Decode in case the tag has special characters
  const tag = decodeURIComponent(name)

  const result = await getPostsByTag(tag, 0, sortBy)

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let bookmarkedIds: string[] = []
  if (user && result.posts.length > 0) {
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', result.posts.map((p) => p.id))
    bookmarkedIds = bookmarks?.map((b) => b.post_id) ?? []
  }

  const bookmarkedSet = new Set(bookmarkedIds)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/search" className="hover:underline">Browse</Link>
          {' / '}Tag
        </p>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            <Badge variant="secondary" className="text-lg px-3 py-1">{tag}</Badge>
          </h1>
        </div>
        <p className="text-muted-foreground">{result.total} post{result.total !== 1 ? 's' : ''}</p>
      </div>

      {/* Sort toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort:</span>
        <Button
          variant={sortBy === 'recent' ? 'default' : 'ghost'}
          size="sm"
          asChild
        >
          <Link href={`/tag/${encodeURIComponent(tag)}`}>Recent</Link>
        </Button>
        <Button
          variant={sortBy === 'popular' ? 'default' : 'ghost'}
          size="sm"
          asChild
        >
          <Link href={`/tag/${encodeURIComponent(tag)}?sort=popular`}>Popular</Link>
        </Button>
      </div>

      {/* Posts */}
      {result.posts.length === 0 ? (
        <EmptyState
          title={`No posts tagged "${tag}"`}
          description="Try searching for something else or browse all content."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/search">Browse all</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isBookmarked={bookmarkedSet.has(post.id)}
              currentUserId={user?.id ?? null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
