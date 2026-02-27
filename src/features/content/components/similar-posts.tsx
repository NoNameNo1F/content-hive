import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { PostWithRelations } from '@/types'

interface SimilarPostsProps {
  posts: PostWithRelations[]
}

export function SimilarPosts({ posts }: SimilarPostsProps) {
  if (posts.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">More like this</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {posts.map((post) => {
          const tags = post.post_tags.map((t) => t.tag)
          return (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="group flex flex-col gap-1.5 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
            >
              <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:underline">
                {post.title}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 capitalize py-0">
                  {post.type}
                </Badge>
                <span>▲ {post.votes_count ?? 0}</span>
                {tags[0] && (
                  <span className="ml-auto truncate opacity-70">#{tags[0]}</span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
