'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export async function deleteList(listId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { error } = await db
    .from('save_lists')
    .delete()
    .eq('id', listId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: 'Failed to delete list.' }

  redirect('/lists')
}
