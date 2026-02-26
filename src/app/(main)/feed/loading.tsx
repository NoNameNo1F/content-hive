import { PostGridSkeleton } from '@/components/shared/post-card-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function FeedLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <PostGridSkeleton count={6} />
    </div>
  )
}
