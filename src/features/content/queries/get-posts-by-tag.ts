import { createSupabaseServer } from '@/lib/supabase/server'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'
import type { PostWithRelations } from '@/types'

interface TagWithPosts {
  tag: string
  posts: PostWithRelations[]
  total: number
}

export async function getPostsByTag(
  tag: string,
  page = 0,
  sortBy: 'recent' | 'popular' = 'recent'
): Promise<TagWithPosts> {
  const supabase = await createSupabaseServer()

  // Get post IDs with this tag
  const { data: tagRows } = await supabase
    .from('post_tags')
    .select('post_id')
    .eq('tag', tag)

  const postIds = tagRows?.map((r) => r.post_id) ?? []
  if (postIds.length === 0) {
    return { tag, posts: [], total: 0 }
  }

  const from = page * DEFAULT_PAGE_SIZE
  const to = from + DEFAULT_PAGE_SIZE - 1

  let query = supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(id, username, avatar_url), post_tags(tag)', { count: 'exact' })
    .in('id', postIds)
    .range(from, to)

  query = sortBy === 'popular'
    ? query.order('saves_count', { ascending: false })
    : query.order('created_at', { ascending: false })

  const { data, error, count } = await query
  if (error) throw new Error(`getPostsByTag: ${error.message}`)

  return {
    tag,
    posts: (data ?? []) as unknown as PostWithRelations[],
    total: count ?? 0,
  }
}
