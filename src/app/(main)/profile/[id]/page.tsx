import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Layers } from 'lucide-react'
import { createSupabaseServer } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { getUserLists } from '@/features/saved-lists/queries/get-user-lists'
import { PostCard } from '@/components/shared/post-card'
import { UserAvatar } from '@/components/shared/user-avatar'
import { EmptyState } from '@/components/shared/empty-state'
import { TelegramSettingsForm } from '@/features/notifications/components/telegram-settings-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PostWithRelations } from '@/types'

interface ProfilePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { id } = await params
  const { tab } = await searchParams
  const activeTab = tab === 'saved' ? 'saved' : tab === 'lists' ? 'lists' : 'posts'

  const supabase = await createSupabaseServer()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  const isOwnProfile = currentUser?.id === id

  // Typed profile query — omits telegram_chat_id to avoid type generation drift
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, created_at')
    .eq('id', id)
    .single()

  if (error || !profile) notFound()

  // Fetch telegram_chat_id separately for own profile.
  // Admin client bypasses type constraint — column added in migration
  // 20260227020000 but generated types not yet updated.
  let telegramChatId: string | null = null
  if (isOwnProfile) {
    const admin = createSupabaseAdmin()
    const { data: notifRow } = await admin
      .from('profiles')
      .select('telegram_chat_id')
      .eq('id', id)
      .single()
    telegramChatId =
      (notifRow as unknown as { telegram_chat_id: string | null } | null)
        ?.telegram_chat_id ?? null
  }

  // Fetch user's interests
  const { data: interests } = await supabase
    .from('user_interests')
    .select('tag')
    .eq('user_id', id)

  const interestTags = interests?.map((i) => i.tag) ?? []

  // Fetch published posts by this user
  const { data: publishedPosts } = await supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(id, username, avatar_url), post_tags(tag)')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  // Fetch bookmarked posts (only accessible for own profile)
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
        .select('*, profiles!posts_user_id_fkey(id, username, avatar_url), post_tags(tag)')
        .in('id', postIds)
      savedPosts = (bookmarkedPosts ?? []) as unknown as PostWithRelations[]
    }
  }

  // Fetch lists for own profile
  const userLists = isOwnProfile ? await getUserLists(id) : []

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
          <p className="text-sm font-medium text-muted-foreground">Types of content</p>
          <div className="flex flex-wrap gap-1">
            {interestTags.map((tag) => (
              <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`}>
                <Badge variant="secondary" className="hover:bg-accent text-xs">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Notification settings — own profile only */}
      {isOwnProfile && (
        <>
          <Separator />
          <TelegramSettingsForm currentChatId={telegramChatId} />
          <Separator />
        </>
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
          {isOwnProfile && (
            <TabsTrigger value="lists" asChild>
              <Link href={`/profile/${id}?tab=lists`}>
                Lists ({userLists.length})
              </Link>
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      {/* Lists tab content */}
      {activeTab === 'lists' && (
        userLists.length === 0 ? (
          <EmptyState
            title="No lists yet"
            description="Create lists to organise posts into collections."
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/lists">Manage lists</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {userLists.map((list) => (
              <Link
                key={list.id}
                href={`/lists/${list.id}`}
                className="flex items-center gap-3 rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Layers size={18} className="text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium leading-snug truncate">{list.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {list.item_count} post{list.item_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* Posts grid — shown for posts and saved tabs */}
      {activeTab !== 'lists' && (
        displayPosts.length === 0 ? (
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
        )
      )}
    </div>
  )
}
