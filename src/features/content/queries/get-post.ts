import { createSupabaseServer } from '@/lib/supabase/server'
import type { PostWithRelations } from '@/types'

/** Returns a post with its author and tags by id. Returns null if not found or not visible. */
export async function getPostById(id: string): Promise<PostWithRelations | null> {
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(id, username, avatar_url), post_tags(tag)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // row not found (or blocked by RLS)
    throw new Error(`getPostById: ${error.message}`)
  }

  return data as unknown as PostWithRelations
}
