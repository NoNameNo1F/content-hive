import { createSupabaseServer } from '@/lib/supabase/server'

export interface CommentRow {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  content: string
  created_at: string
  profiles: { username: string; avatar_url: string | null } | null
}

export async function getComments(postId: string): Promise<CommentRow[]> {
  const supabase = await createSupabaseServer()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('comments')
    .select('id, post_id, user_id, parent_id, content, created_at, profiles!comments_user_id_fkey(username, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  return (data ?? []) as CommentRow[]
}
