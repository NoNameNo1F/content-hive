import { createSupabaseServer } from '@/lib/supabase/server'
import { DEFAULT_PAGE_SIZE, SEARCH_MIN_QUERY_LENGTH } from '@/lib/constants'
import type { PostWithRelations } from '@/types'

interface SearchParams {
  q?: string
  tags?: string[]
  categoryId?: string
  page?: number
}

interface SearchResult {
  posts: PostWithRelations[]
  total: number
}

/**
 * Full-text search across posts using the fts tsvector column.
 * RLS applies automatically — team posts only appear for authenticated users.
 */
export async function searchPosts({
  q,
  tags,
  categoryId,
  page = 0,
}: SearchParams): Promise<SearchResult> {
  const supabase = await createSupabaseServer()
  const from = page * DEFAULT_PAGE_SIZE
  const to = from + DEFAULT_PAGE_SIZE - 1

  let query = supabase
    .from('posts')
    .select('*, profiles(id, username, avatar_url), post_tags(tag)', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (q && q.length >= SEARCH_MIN_QUERY_LENGTH) {
    query = query.textSearch('fts', q, { type: 'websearch' })
  }

  if (categoryId) {
    // Filter via post_categories junction
    const { data: categoryPostIds } = await supabase
      .from('post_categories')
      .select('post_id')
      .eq('category_id', categoryId)
    const ids = categoryPostIds?.map((r) => r.post_id) ?? []
    if (ids.length > 0) {
      query = query.in('id', ids)
    } else {
      return { posts: [], total: 0 }
    }
  }

  if (tags && tags.length > 0) {
    const { data: tagPostIds } = await supabase
      .from('post_tags')
      .select('post_id')
      .in('tag', tags)
    const ids = [...new Set(tagPostIds?.map((r) => r.post_id) ?? [])]
    if (ids.length > 0) {
      query = query.in('id', ids)
    } else {
      return { posts: [], total: 0 }
    }
  }

  const { data, error, count } = await query
  if (error) throw new Error(`searchPosts: ${error.message}`)

  return {
    posts: (data ?? []) as unknown as PostWithRelations[],
    total: count ?? 0,
  }
}
