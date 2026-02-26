import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getPostById } from '@/features/content/queries/get-post'
import { VideoEmbed } from '@/features/content/components/video-embed'
import { DeletePostButton } from '@/features/content/components/delete-post-button'
import { BookmarkButton } from '@/components/shared/bookmark-button'
import { Badge } from '@/components/ui/badge'

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

  const author = post.profiles
  const tags = post.post_tags.map((t) => t.tag)
  const isOwner = user?.id === post.user_id

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">{post.type}</Badge>
          {post.visibility === 'team' && (
            <Badge variant="outline">Team</Badge>
          )}
        </div>

        <h1 className="text-3xl font-bold leading-tight">{post.title}</h1>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>by {author?.username ?? 'Unknown'}</span>
          <div className="flex items-center gap-2">
            {user && (
              <BookmarkButton postId={post.id} initialBookmarked={isBookmarked} />
            )}
            {isOwner && <DeletePostButton postId={post.id} />}
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

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link key={tag} href={`/search?tags=${tag}`}>
              <Badge variant="outline" className="hover:bg-accent">{tag}</Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-4 text-sm text-muted-foreground">
        <span>
          {post.saves_count} save{post.saves_count !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
