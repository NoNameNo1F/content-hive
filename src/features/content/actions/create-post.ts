'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { MAX_TAGS_PER_POST } from '@/lib/constants'
import type { ActionResult, CreatePostInput } from '@/types'

export async function createPost(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const type = formData.get('type') as CreatePostInput['type']
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || undefined
  const url = (formData.get('url') as string)?.trim() || undefined
  const thumbnail = (formData.get('thumbnail') as string)?.trim() || undefined
  const visibility = (formData.get('visibility') as CreatePostInput['visibility']) ?? 'public'
  const tags = (formData.getAll('tags') as string[]).filter(Boolean).slice(0, MAX_TAGS_PER_POST)
  const categoryId = (formData.get('categoryId') as string) || undefined

  if (!title) return { success: false, error: 'Title is required.' }
  if ((type === 'video' || type === 'link') && !url) {
    return { success: false, error: 'A URL is required for video and link posts.' }
  }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'You must be logged in to create posts.' }

  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({ user_id: user.id, type, title, description, url, thumbnail, visibility })
    .select('id')
    .single()

  if (postError || !post) {
    return { success: false, error: 'Failed to create post. Please try again.' }
  }

  if (tags.length > 0) {
    const { error: tagError } = await supabase
      .from('post_tags')
      .insert(tags.map((tag) => ({ post_id: post.id, tag })))
    if (tagError) {
      return { success: false, error: 'Post created but tags failed to save.' }
    }
  }

  if (categoryId) {
    await supabase.from('post_categories').insert({ post_id: post.id, category_id: categoryId })
  }

  redirect(`/post/${post.id}`)
}
