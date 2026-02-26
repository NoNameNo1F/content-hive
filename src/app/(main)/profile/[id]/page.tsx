import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import { PostCard } from '@/components/shared/post-card'
import { UserAvatar } from '@/components/shared/user-avatar'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PostWithRelations } from '@/types'

interface ProfilePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { id } = await params
  const { tab } = await searchParams
  const activeTab = tab === 'saved' ? 'saved' : 'posts'

  const supabase = await createSupabaseServer()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  // Fetch the profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, created_at')
    .eq('id', id)
    .single()

  if (error || !profile) notFound()

  const isOwnProfile = currentUser?.id === id

  // Fetch user's interests
  const { data: interests } = await supabase
    .from('user_interests')
    .select('tag')
    .eq('user_id', id)

  const interestTags = interests?.map((i) => i.tag) ?? []

  // Fetch published posts by this user
  const { data: publishedPosts } = await supabase
    .from('posts')
    .select('*, profiles(id, username, avatar_url), post_tags(tag)')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  // Fetch bookmarked posts (only accessible for own profile or when RLS allows)
  let savedPosts: PostWithRelations[] = []
  if (isOwnProfile && currentUser) {
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    if (bookmarks && bookmarks.length > 0) {
      const postIds = bookmarks.map((b) => b.post_id)
      const { data: bookmarkedPosts } = await supabase
        .from('posts')
        .select('*, profiles(id, username, avatar_url), post_tags(tag)')
        .in('id', postIds)
      savedPosts = (bookmarkedPosts ?? []) as unknown as PostWithRelations[]
    }
  }

  // Fetch current user's bookmarked IDs (for PostCard bookmark state)
  let bookmarkedIds: string[] = []
  if (currentUser) {
    const allPosts = [...(publishedPosts ?? []), ...savedPosts]
    if (allPosts.length > 0) {
      const { data: bm } = await supabase
        .from('bookmarks')
        .select('post_id')
        .eq('user_id', currentUser.id)
        .in('post_id', allPosts.map((p) => p.id))
      bookmarkedIds = bm?.map((b) => b.post_id) ?? []
    }
  }

  const bookmarkedSet = new Set(bookmarkedIds)
  const displayPosts = (
    activeTab === 'saved' ? savedPosts : (publishedPosts ?? []) as unknown as PostWithRelations[]
  )

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <div className="flex items-start gap-4">
        <UserAvatar
          username={profile.username}
          avatarUrl={profile.avatar_url}
          size="lg"
        />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          <p className="text-sm text-muted-foreground">
            {(publishedPosts ?? []).length} post{(publishedPosts ?? []).length !== 1 ? 's' : ''}
          </p>
        </div>
        {isOwnProfile && (
          <div className="ml-auto">
            <Button variant="outline" size="sm" asChild>
              <Link href="/onboarding">Edit interests</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Interest tags */}
      {interestTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Interests</p>
          <div className="flex flex-wrap gap-1">
            {interestTags.map((tag) => (
              <Link key={tag} href={`/search?tags=${tag}`}>
                <Badge variant="secondary" className="hover:bg-accent text-xs">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab}>
        <TabsList>
          <TabsTrigger value="posts" asChild>
            <Link href={`/profile/${id}?tab=posts`}>
              Posts ({(publishedPosts ?? []).length})
            </Link>
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="saved" asChild>
              <Link href={`/profile/${id}?tab=saved`}>
                Saved ({savedPosts.length})
              </Link>
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      {/* Posts grid */}
      {displayPosts.length === 0 ? (
        <EmptyState
          title={activeTab === 'saved' ? 'No saved posts yet' : 'No posts yet'}
          description={
            activeTab === 'saved'
              ? 'Bookmark posts to save them here.'
              : isOwnProfile
                ? 'Share your first link, video, or text.'
                : undefined
          }
          action={
            isOwnProfile && activeTab === 'posts' ? (
              <Button asChild size="sm">
                <Link href="/create">Create post</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isBookmarked={bookmarkedSet.has(post.id)}
              currentUserId={currentUser?.id ?? null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
