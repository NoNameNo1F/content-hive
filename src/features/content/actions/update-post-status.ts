'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { ContentStatus } from '@/types'

export async function updatePostStatus(postId: string, status: ContentStatus): Promise<void> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // RLS enforces ownership — only the post owner can update
  await supabase.from('posts').update({ status }).eq('id', postId).eq('user_id', user.id)

  revalidatePath(`/post/${postId}`)
}
