'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export async function createList(name: string): Promise<ActionResult<{ id: string }>> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'You must be logged in.' }

  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 80) return { success: false, error: 'Invalid list name.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data, error } = await db
    .from('save_lists')
    .insert({ user_id: user.id, name: trimmed })
    .select('id')
    .single()

  if (error || !data) return { success: false, error: 'Failed to create list.' }

  revalidatePath('/lists')
  return { success: true, data: { id: (data as { id: string }).id } }
}
