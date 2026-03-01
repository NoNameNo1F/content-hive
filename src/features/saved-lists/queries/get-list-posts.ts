import { createSupabaseServer } from '@/lib/supabase/server'
import type { PostWithRelations } from '@/types'

export interface ListWithPosts {
  id: string
  name: string
  user_id: string
  posts: PostWithRelations[]
}

export async function getListPosts(listId: string): Promise<ListWithPosts | null> {
  const supabase = await createSupabaseServer()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: list } = await db
    .from('save_lists')
    .select('id, name, user_id')
    .eq('id', listId)
    .maybeSingle()

  if (!list) return null

  const { data: items } = await db
    .from('save_list_items')
    .select('post_id')
    .eq('list_id', listId)
    .order('added_at', { ascending: false })

  const postIds = ((items ?? []) as Array<{ post_id: string }>).map((i) => i.post_id)
  if (postIds.length === 0) {
    return { ...(list as { id: string; name: string; user_id: string }), posts: [] }
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(id, username, avatar_url), post_tags(tag)')
    .in('id', postIds)

  return {
    ...(list as { id: string; name: string; user_id: string }),
    posts: (posts ?? []) as unknown as PostWithRelations[],
  }
}
