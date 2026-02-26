import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { BookmarkButton } from '@/components/shared/bookmark-button'
import type { PostWithRelations } from '@/types'

interface PostCardProps {
  post: PostWithRelations
  isBookmarked?: boolean
  /** Pass the current user's ID so the bookmark button knows whether the user is logged in */
  currentUserId?: string | null
}

export function PostCard({ post, isBookmarked = false, currentUserId }: PostCardProps) {
  const author = post.profiles
  const tags = post.post_tags.map((t) => t.tag)

  return (
    <article className="group rounded-lg border bg-card text-card-foreground transition-shadow hover:shadow-md">
      {/* Thumbnail — only for link/video posts with an image */}
      {post.thumbnail && (
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
          <Image
            src={post.thumbnail}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}

      <div className="space-y-3 p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="shrink-0 text-xs capitalize">
                {post.type}
              </Badge>
              {post.visibility === 'team' && (
                <Badge variant="outline" className="shrink-0 text-xs">Team</Badge>
              )}
            </div>
            <Link
              href={`/post/${post.id}`}
              className="line-clamp-2 font-semibold leading-snug hover:underline"
            >
              {post.title}
            </Link>
          </div>

          {/* Bookmark button — only shown when user is authenticated */}
          {currentUserId && (
            <div className="shrink-0">
              <BookmarkButton postId={post.id} initialBookmarked={isBookmarked} />
            </div>
          )}
        </div>

        {/* Description */}
        {post.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{post.description}</p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 5).map((tag) => (
              <Link key={tag} href={`/search?tags=${tag}`}>
                <Badge variant="outline" className="text-xs hover:bg-accent">
                  {tag}
                </Badge>
              </Link>
            ))}
            {tags.length > 5 && (
              <span className="text-xs text-muted-foreground">+{tags.length - 5} more</span>
            )}
          </div>
        )}

        {/* Footer: author + saves count */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>by {author?.username ?? 'Unknown'}</span>
          <span>{post.saves_count} save{post.saves_count !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </article>
  )
}
