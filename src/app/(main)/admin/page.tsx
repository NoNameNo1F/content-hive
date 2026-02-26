import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { DeletePostButton } from '@/features/content/components/delete-post-button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import Link from 'next/link'

export const metadata = { title: 'Admin — ContentHive' }

export default async function AdminPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/feed')

  // Fetch all posts (RLS admin policy allows this)
  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles(id, username), post_tags(tag)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Content Moderation</h1>
        <p className="text-muted-foreground">
          {posts?.length ?? 0} total posts
        </p>
      </div>

      {!posts || posts.length === 0 ? (
        <EmptyState title="No posts yet" description="Content will appear here once members start posting." />
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize text-xs shrink-0">
                      {post.type}
                    </Badge>
                    {post.visibility === 'team' && (
                      <Badge variant="outline" className="text-xs shrink-0">Team</Badge>
                    )}
                  </div>
                  <Link
                    href={`/post/${post.id}`}
                    className="line-clamp-1 text-sm font-medium hover:underline"
                  >
                    {post.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    by {(post.profiles as { username: string } | null)?.username ?? 'Unknown'} ·{' '}
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="shrink-0">
                  <DeletePostButton postId={post.id} />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
