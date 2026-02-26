import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getFeedPosts } from '@/features/feed/queries/get-feed-posts'
import { PostCard } from '@/components/shared/post-card'
import { Button } from '@/components/ui/button'
import { NavHeader } from '@/components/shared/nav-header'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

export const metadata = { title: 'ContentHive — Your team resource hub' }

export default async function RootPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Authenticated users go straight to the personalised feed
  if (user) {
    const { redirect } = await import('next/navigation')
    redirect('/feed')
  }

  // Visitors: show recent public posts
  const posts = await getFeedPosts({ userId: null, page: 0, sortBy: 'recent' })

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />

      <main className="mx-auto max-w-5xl px-4 py-16">
        {/* Hero */}
        <div className="mb-16 space-y-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Your team&apos;s shared brain
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Collect links, videos, and notes. Get a personalised feed based on
            your interests. Stay in sync with your team.
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/register">Get started — it&apos;s free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>

        {/* Recent public posts */}
        {posts.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Recent content</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.slice(0, DEFAULT_PAGE_SIZE).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
