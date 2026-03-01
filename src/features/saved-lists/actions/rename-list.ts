'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export async function renameList(listId: string, name: string): Promise<ActionResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized.' }

  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 80) return { success: false, error: 'Invalid list name.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { error } = await db
    .from('save_lists')
    .update({ name: trimmed })
    .eq('id', listId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'Failed to rename list.' }

  revalidatePath('/lists')
  revalidatePath(`/lists/${listId}`)
  return { success: true, data: undefined }
}
