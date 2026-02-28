import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getPostById } from '@/features/content/queries/get-post'
import { getSimilarPosts } from '@/features/content/queries/get-similar-posts'
import { VideoEmbed } from '@/features/content/components/video-embed'
import { DeletePostButton } from '@/features/content/components/delete-post-button'
import { PostStatusUpdater } from '@/features/content/components/post-status-updater'
import { SimilarPosts } from '@/features/content/components/similar-posts'
import { BookmarkButton } from '@/components/shared/bookmark-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Layers } from 'lucide-react'
import type { ContentStatus } from '@/types'

const STATUS_BADGE_STYLES: Record<ContentStatus, string> = {
  available:   'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  unavailable: 'bg-muted text-muted-foreground',
}

const STATUS_LABELS: Record<ContentStatus, string> = {
  available:   'Available',
  unavailable: 'Unavailable',
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  if (days < 30)  return `${days} day${days !== 1 ? 's' : ''} ago`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface PostPageProps {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params
  const post = await getPostById(id)
  if (!post) notFound()

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isBookmarked = false
  if (user) {
    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', id)
      .maybeSingle()
    isBookmarked = !!data
  }

  const author  = post.profiles
  const tags    = post.post_tags.map((t) => t.tag)
  const isOwner = user?.id === post.user_id
  const hasShoppingCart = (post as { has_shopping_cart?: boolean }).has_shopping_cart ?? false
  const isCarousel      = (post as { is_carousel?: boolean }).is_carousel ?? false
  const updatedAt       = (post as { updated_at?: string | null }).updated_at ?? null
  const showUpdated     = updatedAt && Math.abs(new Date(updatedAt).getTime() - new Date(post.created_at).getTime()) > 60_000

  const similarPosts = await getSimilarPosts(post.id, tags)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="capitalize">{post.type}</Badge>
          {post.visibility === 'team' && (
            <Badge variant="outline">Team</Badge>
          )}
          {!isOwner && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_STYLES[post.status as ContentStatus]}`}>
              {STATUS_LABELS[post.status as ContentStatus]}
            </span>
          )}
          {hasShoppingCart && (
            <span className="flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
              <ShoppingCart size={10} /> Shop
            </span>
          )}
          {isCarousel && (
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              <Layers size={10} /> Carousel
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold leading-tight">{post.title}</h1>

        {/* Creator handle */}
        {post.creator_handle && (
          <p className="text-sm text-muted-foreground">
            Creator:{' '}
            <span className="font-medium text-foreground">{post.creator_handle}</span>
          </p>
        )}

        <div className="flex items-center justify-between gap-4 flex-wrap text-sm text-muted-foreground">
          <span>by {author?.username ?? 'Unknown'}</span>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Owner: inline status updater */}
            {isOwner && (
              <PostStatusUpdater postId={post.id} currentStatus={post.status as ContentStatus} />
            )}
            {user && (
              <BookmarkButton postId={post.id} initialBookmarked={isBookmarked} />
            )}
            {isOwner && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/post/${post.id}/edit`}>Edit</Link>
                </Button>
                <DeletePostButton postId={post.id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video embed */}
      {post.type === 'video' && post.url && (
        <VideoEmbed url={post.url} />
      )}

      {/* Thumbnail for link posts */}
      {post.type === 'link' && post.thumbnail && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <Image
            src={post.thumbnail}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {/* External link */}
      {(post.type === 'link' || post.type === 'video') && post.url && (
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 break-all text-sm text-primary hover:underline"
        >
          {post.url} ↗
        </a>
      )}

      {/* Description */}
      {post.description && (
        <p className="leading-relaxed text-muted-foreground">{post.description}</p>
      )}

      {/* Hashtags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`}>
              <Badge variant="outline" className="hover:bg-accent">#{tag}</Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-4 text-sm text-muted-foreground space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <span>Added {relativeTime(post.created_at)}</span>
          {showUpdated && updatedAt && (
            <span>· Updated {relativeTime(updatedAt)}</span>
          )}
        </div>
        <span>{post.saves_count} save{post.saves_count !== 1 ? 's' : ''}</span>
      </div>

      {/* Similar content */}
      {similarPosts.length > 0 && (
        <div className="border-t pt-6">
          <SimilarPosts posts={similarPosts} />
        </div>
      )}
    </div>
  )
}
