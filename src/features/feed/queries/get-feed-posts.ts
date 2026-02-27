import { createSupabaseServer } from '@/lib/supabase/server'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'
import type { ContentStatus, PostWithRelations } from '@/types'

interface FeedParams {
  userId?: string | null
  page?: number
  sortBy?: 'recent' | 'popular'
  status?: ContentStatus
}

/** Returns paginated posts for the feed, filtered by interests for authenticated users. */
export async function getFeedPosts({
  userId,
  page = 0,
  sortBy = 'recent',
  status,
}: FeedParams): Promise<PostWithRelations[]> {
  const supabase = await createSupabaseServer()
  const from = page * DEFAULT_PAGE_SIZE
  const to = from + DEFAULT_PAGE_SIZE - 1

  let query = supabase
    .from('posts')
    .select('*, profiles(id, username, avatar_url), post_tags(tag)')
    .range(from, to)

  if (sortBy === 'popular') {
    query = query.order('saves_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (userId) {
    // Authenticated: show interest-matched posts (RLS handles team vs public visibility)
    const { data: interests } = await supabase
      .from('user_interests')
      .select('tag')
      .eq('user_id', userId)

    const tags = interests?.map((i) => i.tag) ?? []

    if (tags.length > 0) {
      const { data: matchedIds } = await supabase
        .from('post_tags')
        .select('post_id')
        .in('tag', tags)

      const ids = [...new Set(matchedIds?.map((m) => m.post_id) ?? [])]
      if (ids.length > 0) {
        query = query.in('id', ids)
      } else {
        // No matched posts — return empty rather than all posts
        return []
      }
    }
    // RLS automatically scopes visibility (public + team for authenticated users)
  } else {
    // Visitor: public posts only. RLS enforces this, but be explicit for clarity.
    query = query.eq('visibility', 'public')
  }

  const { data, error } = await query
  if (error) throw new Error(`getFeedPosts: ${error.message}`)
  return (data ?? []) as unknown as PostWithRelations[]
}
