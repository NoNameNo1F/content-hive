import { createSupabaseServer } from '@/lib/supabase/server'
import type { PostWithRelations } from '@/types'

/** Returns up to `limit` posts that share at least one tag with the given post,
 *  ordered by votes_count descending. Excludes the post itself. */
export async function getSimilarPosts(
  postId: string,
  tags: string[],
  limit = 4,
): Promise<PostWithRelations[]> {
  if (tags.length === 0) return []

  const supabase = await createSupabaseServer()

  // Find post IDs that share at least one tag (deduped)
  const { data: tagMatches } = await supabase
    .from('post_tags')
    .select('post_id')
    .in('tag', tags)
    .neq('post_id', postId)

  const ids = [...new Set(tagMatches?.map((r) => r.post_id) ?? [])]
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(id, username, avatar_url), post_tags(tag)')
    .in('id', ids)
    .order('votes_count', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getSimilarPosts: ${error.message}`)
  return (data ?? []) as unknown as PostWithRelations[]
}
