import { createSupabaseServer } from '@/lib/supabase/server'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'
import type { ContentStatus, PostWithRelations } from '@/types'

export type FeedSortBy = 'new' | 'hot' | 'top'

interface FeedParams {
  userId?: string | null
  page?: number
  sortBy?: FeedSortBy
  status?: ContentStatus
  categoryId?: string | null
}

/** Returns paginated posts for the feed.
 *  Authenticated users get interest-boosted results via the
 *  get_feed_personalized RPC (all posts visible, matched ones rank higher).
 *  Guests get a plain public feed ordered by the chosen sort. */
export async function getFeedPosts({
  userId,
  page = 0,
  sortBy = 'hot',
  status,
  categoryId,
}: FeedParams): Promise<PostWithRelations[]> {
  const supabase = await createSupabaseServer()
  const limit  = DEFAULT_PAGE_SIZE
  const offset = page * DEFAULT_PAGE_SIZE

  // ── Authenticated: interest-boosted personalised feed ──────────────────────
  if (userId) {
    let rpc = supabase
      .rpc('get_feed_personalized', {
        p_user_id:    userId,
        p_sort_by:    sortBy,
        p_status:     status ?? undefined,
        p_category_id: categoryId ?? undefined,
        p_limit:      limit,
        p_offset:     offset,
      })
      .select('*, profiles!posts_user_id_fkey(id, username, avatar_url), post_tags(tag)')

    const { data, error } = await rpc
    if (error) throw new Error(`getFeedPosts(rpc): ${error.message}`)
    return (data ?? []) as unknown as PostWithRelations[]
  }

  // ── Guest: plain public feed ────────────────────────────────────────────────
  let query = supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(id, username, avatar_url), post_tags(tag)')
    .eq('visibility', 'public')
    .range(offset, offset + limit - 1)

  if (sortBy === 'hot') {
    query = query.order('votes_count', { ascending: false }).order('created_at', { ascending: false })
  } else if (sortBy === 'top') {
    query = query.order('saves_count', { ascending: false }).order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (categoryId) {
    // Filter to posts that appear in this category
    const { data: catPosts } = await supabase
      .from('post_categories')
      .select('post_id')
      .eq('category_id', categoryId)

    const ids = catPosts?.map((r) => r.post_id) ?? []
    if (ids.length === 0) return []
    query = query.in('id', ids)
  }

  const { data, error } = await query
  if (error) throw new Error(`getFeedPosts: ${error.message}`)
  return (data ?? []) as unknown as PostWithRelations[]
}
