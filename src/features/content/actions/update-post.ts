'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { MAX_TAGS_PER_POST } from '@/lib/constants'
import type { ActionResult } from '@/types'

export async function updatePost(
  postId: string,
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || undefined
  const url = (formData.get('url') as string)?.trim() || undefined
  const thumbnail = (formData.get('thumbnail') as string)?.trim() || undefined
  const visibility = (formData.get('visibility') as 'public' | 'team') ?? 'public'
  const status = (formData.get('status') as 'available' | 'in_use' | 'used' | 'rejected') ?? 'available'
  const creatorHandle = (formData.get('creatorHandle') as string)?.trim() || null
  const tags = (formData.getAll('tags') as string[]).filter(Boolean).slice(0, MAX_TAGS_PER_POST)
  const categoryId = (formData.get('categoryId') as string) || undefined

  if (!title) return { success: false, error: 'Title is required.' }

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'You must be logged in.' }

  // Verify ownership (RLS also enforces this, but fail fast with a clear message)
  const { data: existing } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single()

  if (!existing) return { success: false, error: 'Post not found.' }
  if (existing.user_id !== user.id) return { success: false, error: 'You can only edit your own posts.' }

  // Update the post
  const { error: postError } = await supabase
    .from('posts')
    .update({ title, description, url, thumbnail, visibility, status, creator_handle: creatorHandle })
    .eq('id', postId)

  if (postError) return { success: false, error: 'Failed to update post.' }

  // Replace tags: delete all then re-insert
  await supabase.from('post_tags').delete().eq('post_id', postId)
  if (tags.length > 0) {
    const { error: tagError } = await supabase
      .from('post_tags')
      .insert(tags.map((tag) => ({ post_id: postId, tag })))
    if (tagError) return { success: false, error: 'Post updated but tags failed to save.' }
  }

  // Replace category: delete then re-insert
  await supabase.from('post_categories').delete().eq('post_id', postId)
  if (categoryId) {
    await supabase.from('post_categories').insert({ post_id: postId, category_id: categoryId })
  }

  redirect(`/post/${postId}`)
}
