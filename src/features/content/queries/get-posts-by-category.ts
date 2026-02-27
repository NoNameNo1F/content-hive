import { createSupabaseServer } from '@/lib/supabase/server'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'
import type { PostWithRelations } from '@/types'

interface CategoryWithPosts {
  id: string
  name: string
  slug: string
  posts: PostWithRelations[]
  total: number
}

export async function getPostsByCategory(
  slug: string,
  page = 0,
  sortBy: 'recent' | 'popular' = 'recent'
): Promise<CategoryWithPosts | null> {
  const supabase = await createSupabaseServer()

  // Resolve category by slug
  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (!category) return null

  // Get post IDs in this category
  const { data: postCategoryRows } = await supabase
    .from('post_categories')
    .select('post_id')
    .eq('category_id', category.id)

  const postIds = postCategoryRows?.map((r) => r.post_id) ?? []
  if (postIds.length === 0) {
    return { ...category, posts: [], total: 0 }
  }

  const from = page * DEFAULT_PAGE_SIZE
  const to = from + DEFAULT_PAGE_SIZE - 1

  let query = supabase
    .from('posts')
    .select('*, profiles(id, username, avatar_url), post_tags(tag)', { count: 'exact' })
    .in('id', postIds)
    .range(from, to)

  query = sortBy === 'popular'
    ? query.order('saves_count', { ascending: false })
    : query.order('created_at', { ascending: false })

  const { data, error, count } = await query
  if (error) throw new Error(`getPostsByCategory: ${error.message}`)

  return {
    ...category,
    posts: (data ?? []) as unknown as PostWithRelations[],
    total: count ?? 0,
  }
}
