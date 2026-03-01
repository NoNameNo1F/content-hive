import { createSupabaseServer } from '@/lib/supabase/server'

/** Returns the list IDs that contain a given post for the current user. */
export async function getPostListMembership(postId: string): Promise<string[]> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Get user's list IDs first
  const { data: lists } = await db
    .from('save_lists')
    .select('id')
    .eq('user_id', user.id)

  const listIds = ((lists ?? []) as Array<{ id: string }>).map((l) => l.id)
  if (listIds.length === 0) return []

  const { data: items } = await db
    .from('save_list_items')
    .select('list_id')
    .eq('post_id', postId)
    .in('list_id', listIds)

  return ((items ?? []) as Array<{ list_id: string }>).map((i) => i.list_id)
}
