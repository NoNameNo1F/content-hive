import { createSupabaseServer } from '@/lib/supabase/server'
import type { PostWithRelations } from '@/types'

export interface BoardData {
  available: PostWithRelations[]
  unavailable: PostWithRelations[]
}

/** Returns all posts visible to the current user, grouped by availability. */
export async function getBoardPosts(): Promise<BoardData> {
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(id, username, avatar_url), post_tags(tag)')
    .order('votes_count', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getBoardPosts: ${error.message}`)

  const posts = (data ?? []) as unknown as PostWithRelations[]

  return {
    available:   posts.filter((p) => p.status === 'available'),
    unavailable: posts.filter((p) => p.status === 'unavailable'),
  }
}
