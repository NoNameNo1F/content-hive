import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getUserInterests } from '@/features/auth/queries/get-interests'
import { getFeedPosts, type FeedSortBy } from '@/features/feed/queries/get-feed-posts'
import { getUserVotes } from '@/features/content/queries/get-user-votes'
import { FeedList } from '@/features/feed/components/feed-list'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'
import type { ContentStatus } from '@/types'

export const metadata = { title: 'Feed — ContentHive' }

const VALID_STATUSES = new Set(['available', 'in_use', 'used', 'rejected'])
const VALID_SORTS = new Set<string>(['new', 'hot', 'top'])

interface FeedPageProps {
  searchParams: Promise<{ sort?: string; status?: string }>
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const { sort, status: statusParam } = await searchParams
  const sortBy: FeedSortBy = VALID_SORTS.has(sort ?? '') ? (sort as FeedSortBy) : 'hot'
  const status = VALID_STATUSES.has(statusParam ?? '') ? (statusParam as ContentStatus) : undefined

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

  const posts = await getFeedPosts({ userId: user?.id, page: 0, sortBy, status })

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
        initialUserVotes={userVotes}
        currentUserId={user?.id ?? null}
        hasMore={posts.length === DEFAULT_PAGE_SIZE}
        userId={user?.id ?? null}
        initialSort={sortBy}
        initialStatus={status}
      />
    </div>
  )
}
