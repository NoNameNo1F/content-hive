import { createSupabaseServer } from '@/lib/supabase/server'

export interface GraphPost {
  id: string
  title: string
  type: string
  url: string | null
  thumbnail: string | null
  votes_count: number
  saves_count: number
  status: string
}

export interface GraphCategory {
  id: string
  name: string
  slug: string
  posts: GraphPost[]
}

export interface GraphHashtag {
  tag: string
  postIds: string[]
}

export interface GraphData {
  categories: GraphCategory[]
  hashtags: GraphHashtag[]
}

/** Returns all categories with their categorised posts + all hashtags with their post IDs. */
export async function getGraphData(): Promise<GraphData> {
  const supabase = await createSupabaseServer()

  const [{ data: categories }, { data: links }, { data: tagLinks }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('post_categories')
      .select('category_id, posts(id, title, type, url, thumbnail, votes_count, saves_count, status)'),
    supabase.from('post_tags').select('post_id, tag'),
  ])

  if (!categories?.length) return { categories: [], hashtags: [] }

  // Group posts by category_id
  const postsByCategory = new Map<string, GraphPost[]>()
  for (const link of (links ?? []) as Array<{
    category_id: string
    posts: GraphPost | null
  }>) {
    if (!link.posts) continue
    const list = postsByCategory.get(link.category_id) ?? []
    list.push(link.posts)
    postsByCategory.set(link.category_id, list)
  }

  // Group post IDs by hashtag
  const postsByTag = new Map<string, string[]>()
  for (const row of (tagLinks ?? []) as Array<{ post_id: string; tag: string }>) {
    const list = postsByTag.get(row.tag) ?? []
    list.push(row.post_id)
    postsByTag.set(row.tag, list)
  }

  const resolvedCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    posts: (postsByCategory.get(cat.id) ?? []).sort(
      (a, b) => (b.votes_count ?? 0) - (a.votes_count ?? 0)
    ),
  }))

  const hashtags: GraphHashtag[] = Array.from(postsByTag.entries()).map(([tag, postIds]) => ({
    tag,
    postIds,
  }))

  return { categories: resolvedCategories, hashtags }
}
