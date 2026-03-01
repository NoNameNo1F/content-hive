'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { broadcastTelegram } from '@/lib/telegram'
import { getEmbeddingConfig, generateEmbedding } from '@/lib/embeddings'
import { MAX_HASHTAGS } from '@/lib/constants'
import type { ActionResult, CreatePostInput } from '@/types'

async function generatePostEmbedding(
  postId:      string,
  title:       string,
  description: string | undefined
) {
  try {
    const config = await getEmbeddingConfig()
    if (!config) return
    const text      = [title, description].filter(Boolean).join(' ')
    const embedding = await generateEmbedding(text, config)
    const admin     = createSupabaseAdmin()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any
    await db.from('posts').update({ embedding }).eq('id', postId)
  } catch {
    // Ignore — search falls back to FTS when embeddings are unavailable
  }
}

export async function createPost(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const type = formData.get('type') as CreatePostInput['type']
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || undefined
  const url = (formData.get('url') as string)?.trim() || undefined
  const thumbnail = (formData.get('thumbnail') as string)?.trim() || undefined
  const creatorHandle = (formData.get('creatorHandle') as string)?.trim() || undefined
  const hasShoppingCart = formData.get('hasShoppingCart') === 'true'
  const isCarousel = formData.get('isCarousel') === 'true'
  const tags = (formData.getAll('tags') as string[]).filter(Boolean).slice(0, MAX_HASHTAGS)
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
    .insert({
      user_id: user.id,
      type,
      title,
      description,
      url,
      thumbnail,
      visibility: 'public',
      status: 'available',
      creator_handle: creatorHandle,
      has_shopping_cart: hasShoppingCart,
      is_carousel: isCarousel,
    })
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

  // Notify team members on Telegram (fire-and-forget)
  const username = (user.user_metadata?.username as string | undefined) ?? 'A team member'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  void broadcastTelegram(
    user.id,
    `📢 <b>${username}</b> added a new post: <a href="${appUrl}/post/${post.id}">${title}</a>`
  )

  // Generate and store embedding (fire-and-forget)
  void generatePostEmbedding(post.id, title, description)

  redirect(`/post/${post.id}`)
}
