import { Skeleton } from '@/components/ui/skeleton'
import { PostGridSkeleton } from '@/components/shared/post-card-skeleton'

export default function CategoryLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
      <PostGridSkeleton count={6} />
    </div>
  )
}
