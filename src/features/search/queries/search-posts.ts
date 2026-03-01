import { createSupabaseServer } from '@/lib/supabase/server'
import { DEFAULT_PAGE_SIZE, SEARCH_MIN_QUERY_LENGTH } from '@/lib/constants'
import { getEmbeddingConfig, generateEmbedding } from '@/lib/embeddings'
import type { ContentStatus, PostWithRelations } from '@/types'

interface SearchParams {
  q?: string
  tags?: string[]
  categoryId?: string
  status?: ContentStatus
  page?: number
}

interface SearchResult {
  posts: PostWithRelations[]
  total: number
}

/**
 * Search posts. On page 0 with a substantial query, attempts vector similarity
 * search if an embedding provider is configured. Falls back to FTS on failure
 * or if no config exists.
 */
export async function searchPosts({
  q,
  tags,
  categoryId,
  status,
  page = 0,
}: SearchParams): Promise<SearchResult> {
  const supabase = await createSupabaseServer()

  // ── Vector search (first page only, requires embedding config) ───────────────
  if (q && q.length >= SEARCH_MIN_QUERY_LENGTH && page === 0) {
    try {
      const config = await getEmbeddingConfig()
      if (config) {
        const embedding    = await generateEmbedding(q, config)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db           = supabase as any
        const { data: matches } = await db.rpc('match_posts', {
          query_embedding: embedding,
          match_count:     50,
        })

        if (matches && (matches as { id: string }[]).length > 0) {
          const matchedIds = (matches as { id: string }[]).map((m) => m.id)
          const orderMap   = new Map(matchedIds.map((id, i) => [id, i]))

          let query = supabase
            .from('posts')
            .select(
              '*, profiles!posts_user_id_fkey(id, username, avatar_url), post_tags(tag)',
              { count: 'exact' }
            )
            .in('id', matchedIds)

          if (status) {
            query = query.eq('status', status)
          }

          if (categoryId) {
            const { data: catRows } = await supabase
              .from('post_categories')
              .select('post_id')
              .eq('category_id', categoryId)
            const catIds = catRows?.map((r) => r.post_id) ?? []
            if (catIds.length === 0) return { posts: [], total: 0 }
            query = query.in('id', catIds)
          }

          if (tags && tags.length > 0) {
            const { data: tagRows } = await supabase
              .from('post_tags')
              .select('post_id')
              .in('tag', tags)
            const tagIds = [...new Set(tagRows?.map((r) => r.post_id) ?? [])]
            if (tagIds.length === 0) return { posts: [], total: 0 }
            query = query.in('id', tagIds)
          }

          const { data, count } = await query
          if (data && data.length > 0) {
            const sorted = (data as PostWithRelations[]).sort(
              (a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999)
            )
            return { posts: sorted, total: count ?? sorted.length }
          }
        }
      }
    } catch {
      // Fall through to FTS
    }
  }

  // ── FTS fallback ──────────────────────────────────────────────────────────────
  const from = page * DEFAULT_PAGE_SIZE
  const to   = from + DEFAULT_PAGE_SIZE - 1

  let query = supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(id, username, avatar_url), post_tags(tag)', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (q && q.length >= SEARCH_MIN_QUERY_LENGTH) {
    query = query.textSearch('fts', q, { type: 'websearch' })
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (categoryId) {
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
