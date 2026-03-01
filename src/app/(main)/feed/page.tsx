import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getUserInterests } from '@/features/auth/queries/get-interests'
import { getFeedPosts } from '@/features/feed/queries/get-feed-posts'
import { getUserVotes } from '@/features/content/queries/get-user-votes'
import { FeedList } from '@/features/feed/components/feed-list'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

export const metadata = { title: 'Feed — ContentHive' }

export default async function FeedPage() {
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

  const posts = await getFeedPosts({ userId: user?.id, page: 0, sortBy: 'hot' })

  // Fetch bookmarked post IDs and vote statuses for the initial page
  let bookmarkedIds: string[] = []
  let userVotes: Record<string, 1 | -1> = {}
  if (user && posts.length > 0) {
    const postIds = posts.map((p) => p.id)
    const [bookmarks, votes] = await Promise.all([
      supabase.from('bookmarks').select('post_id').eq('user_id', user.id).in('post_id', postIds),
      getUserVotes(user.id, postIds),
    ])
    bookmarkedIds = bookmarks.data?.map((b) => b.post_id) ?? []
    userVotes = votes
  }

  return (
    <FeedList
      initialPosts={posts}
      bookmarkedIds={bookmarkedIds}
      initialUserVotes={userVotes}
      currentUserId={user?.id ?? null}
      hasMore={posts.length === DEFAULT_PAGE_SIZE}
      userId={user?.id ?? null}
    />
  )
}
