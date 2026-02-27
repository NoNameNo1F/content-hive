import { notFound, redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getPostById } from '@/features/content/queries/get-post'
import { EditPostForm } from '@/features/content/components/edit-post-form'
import type { Category } from '@/types'

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params
  const post = await getPostById(id)
  if (!post) notFound()

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (user.id !== post.user_id) redirect(`/post/${id}`)

  // Fetch current category for this post
  const { data: postCategory } = await supabase
    .from('post_categories')
    .select('category_id')
    .eq('post_id', id)
    .maybeSingle()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, created_at')
    .order('name')

  const tags = post.post_tags.map((t) => t.tag)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Edit post</h1>
        <p className="text-muted-foreground">Update your post details below.</p>
      </div>

      <EditPostForm
        postId={id}
        initialTitle={post.title}
        initialDescription={post.description ?? ''}
        initialUrl={post.url ?? ''}
        initialThumbnail={post.thumbnail ?? ''}
        initialTags={tags}
        initialVisibility={post.visibility as 'public' | 'team'}
        initialCategoryId={postCategory?.category_id ?? ''}
        initialStatus={post.status}
        initialCreatorHandle={post.creator_handle ?? ''}
        postType={post.type}
        categories={(categories ?? []) as Category[]}
      />
    </div>
  )
}
