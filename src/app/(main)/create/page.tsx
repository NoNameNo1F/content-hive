import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { PostForm } from '@/features/content/components/post-form'
import type { Category } from '@/types'

export const metadata = { title: 'New Post — ContentHive' }

export default async function CreatePage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, created_at')
    .order('name')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">New Post</h1>
        <p className="text-muted-foreground">
          Share a link, video, or text with the community.
        </p>
      </div>

      <PostForm categories={(categories ?? []) as Category[]} />
    </div>
  )
}
