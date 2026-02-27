import { createSupabaseServer } from '@/lib/supabase/server'

export interface GraphPost {
  id: string
  title: string
  type: string
  url: string | null
  thumbnail: string | null
  votes_count: number
}

export interface GraphCategory {
  id: string
  name: string
  slug: string
  posts: GraphPost[]
}

/** Returns all categories with their categorised posts (sorted by votes desc). */
export async function getGraphData(): Promise<GraphCategory[]> {
  const supabase = await createSupabaseServer()

  const [{ data: categories }, { data: links }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('post_categories')
      .select('category_id, posts(id, title, type, url, thumbnail, votes_count)'),
  ])

  if (!categories?.length) return []

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

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    posts: (postsByCategory.get(cat.id) ?? []).sort(
      (a, b) => (b.votes_count ?? 0) - (a.votes_count ?? 0)
    ),
  }))
}
