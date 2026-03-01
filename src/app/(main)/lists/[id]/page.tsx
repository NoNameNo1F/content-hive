import { notFound, redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getListPosts } from '@/features/saved-lists/queries/get-list-posts'
import { ListManager } from '@/features/saved-lists/components/list-manager'
import { PostCard } from '@/components/shared/post-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ListPageProps {
  params: Promise<{ id: string }>
}

export default async function ListPage({ params }: ListPageProps) {
  const { id } = await params
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const list = await getListPosts(id)
  if (!list) notFound()

  const isOwner = user.id === list.user_id

  // Bookmark state for post cards
  let bookmarkedIds: string[] = []
  if (list.posts.length > 0) {
    const { data: bm } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', list.posts.map((p) => p.id))
    bookmarkedIds = bm?.map((b) => b.post_id) ?? []
  }
  const bookmarkedSet = new Set(bookmarkedIds)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/lists" className="text-sm text-muted-foreground hover:text-foreground">
              Lists
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-xl font-bold">{list.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {list.posts.length} post{list.posts.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isOwner && <ListManager listId={list.id} currentName={list.name} />}
      </div>

      {list.posts.length === 0 ? (
        <EmptyState
          title="No posts in this list"
          description="Save posts to this list using the bookmark icon on any post."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/feed">Browse feed</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isBookmarked={bookmarkedSet.has(post.id)}
              currentUserId={user.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
