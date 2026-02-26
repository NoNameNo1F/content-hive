import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getUserInterests } from '@/features/auth/queries/get-interests'
import { getFeedPosts } from '@/features/feed/queries/get-feed-posts'
import { FeedList } from '@/features/feed/components/feed-list'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

export const metadata = { title: 'Feed — ContentHive' }

interface FeedPageProps {
  searchParams: Promise<{ sort?: string }>
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const { sort } = await searchParams
  const sortBy = sort === 'popular' ? 'popular' : 'recent'

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Authenticated users with no interests go to onboarding
  if (user) {
    const interests = await getUserInterests()
    if (interests.length === 0) {
      redirect('/onboarding')
    }
  }

  const posts = await getFeedPosts({ userId: user?.id, page: 0, sortBy })

  // Fetch bookmarked post IDs for current user
  let bookmarkedIds: string[] = []
  if (user && posts.length > 0) {
    const postIds = posts.map((p) => p.id)
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)
    bookmarkedIds = bookmarks?.map((b) => b.post_id) ?? []
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {user ? 'Your Feed' : 'Discover Content'}
        </h1>
        <p className="text-muted-foreground">
          {user
            ? 'Content matched to your interests'
            : 'Browse public content from the community'}
        </p>
      </div>

      <FeedList
        initialPosts={posts}
        bookmarkedIds={bookmarkedIds}
        currentUserId={user?.id ?? null}
        hasMore={posts.length === DEFAULT_PAGE_SIZE}
        userId={user?.id ?? null}
      />
    </div>
  )
}
