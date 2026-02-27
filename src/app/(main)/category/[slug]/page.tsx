import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getPostsByCategory } from '@/features/content/queries/get-posts-by-category'
import { PostCard } from '@/components/shared/post-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string }>
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const { sort } = await searchParams
  const sortBy = sort === 'popular' ? 'popular' : 'recent'

  const result = await getPostsByCategory(slug, 0, sortBy)
  if (!result) notFound()

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
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/search" className="hover:underline">Browse</Link>
          {' / '}Category
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{result.name}</h1>
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
          <Link href={`/category/${slug}`}>Recent</Link>
        </Button>
        <Button
          variant={sortBy === 'popular' ? 'default' : 'ghost'}
          size="sm"
          asChild
        >
          <Link href={`/category/${slug}?sort=popular`}>Popular</Link>
        </Button>
      </div>

      {/* Posts */}
      {result.posts.length === 0 ? (
        <EmptyState
          title="No posts in this category yet"
          description="Be the first to add content here."
          action={
            user ? (
              <Button asChild size="sm">
                <Link href="/create">Create post</Link>
              </Button>
            ) : undefined
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
