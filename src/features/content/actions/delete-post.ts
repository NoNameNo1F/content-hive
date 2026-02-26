'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export async function deletePost(postId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'You must be logged in.' }

  // RLS on the DELETE policy enforces ownership — only the owner or admin can delete
  const { error } = await supabase.from('posts').delete().eq('id', postId)

  if (error) return { success: false, error: 'Failed to delete post.' }

  redirect('/feed')
}
