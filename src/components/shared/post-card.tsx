import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { BookmarkButton } from '@/components/shared/bookmark-button'
import type { ContentStatus, PostWithRelations } from '@/types'

const STATUS_STYLES: Record<ContentStatus, string> = {
  available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  in_use:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  used:      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  rejected:  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const STATUS_LABELS: Record<ContentStatus, string> = {
  available: 'Available',
  in_use:    'In use',
  used:      'Used',
  rejected:  'Rejected',
}

function StatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

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
              <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`}>
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

        {/* Creator handle */}
        {post.creator_handle && (
          <p className="text-xs text-muted-foreground">
            Creator: <span className="font-medium">{post.creator_handle}</span>
          </p>
        )}

        {/* Footer: author + status + saves count */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>by {author?.username ?? 'Unknown'}</span>
          <div className="flex items-center gap-2">
            <StatusBadge status={post.status} />
            <span>{post.saves_count} save{post.saves_count !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
