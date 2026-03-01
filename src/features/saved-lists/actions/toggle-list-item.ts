'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export async function toggleListItem(
  listId: string,
  postId: string
): Promise<ActionResult<{ added: boolean }>> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'You must be logged in.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Verify ownership
  const { data: list } = await db
    .from('save_lists')
    .select('id')
    .eq('id', listId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!list) return { success: false, error: 'List not found.' }

  const { data: existing } = await db
    .from('save_list_items')
    .select('list_id')
    .eq('list_id', listId)
    .eq('post_id', postId)
    .maybeSingle()

  if (existing) {
    await db.from('save_list_items').delete().eq('list_id', listId).eq('post_id', postId)
    return { success: true, data: { added: false } }
  }

  await db.from('save_list_items').insert({ list_id: listId, post_id: postId })
  return { success: true, data: { added: true } }
}
