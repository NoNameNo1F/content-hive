'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

/** Toggles a bookmark on a post. Idempotent — safe to call multiple times. */
export async function toggleBookmark(
  postId: string
): Promise<ActionResult<{ bookmarked: boolean }>> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'You must be logged in to save posts.' }

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)
    if (error) return { success: false, error: 'Failed to remove bookmark.' }
    return { success: true, data: { bookmarked: false } }
  }

  const { error } = await supabase
    .from('bookmarks')
    .insert({ user_id: user.id, post_id: postId })
  if (error) return { success: false, error: 'Failed to save post.' }
  return { success: true, data: { bookmarked: true } }
}
