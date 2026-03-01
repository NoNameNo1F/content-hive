'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export async function createComment(
  postId: string,
  content: string,
  parentId?: string | null
): Promise<ActionResult> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'You must be logged in to comment.' }

  const trimmed = content.trim()
  if (!trimmed || trimmed.length > 1000) return { success: false, error: 'Invalid comment.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { error } = await db.from('comments').insert({
    post_id: postId,
    user_id: user.id,
    parent_id: parentId ?? null,
    content: trimmed,
  })

  if (error) return { success: false, error: 'Failed to post comment.' }

  revalidatePath(`/post/${postId}`)
  return { success: true, data: undefined }
}
