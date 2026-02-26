import { Skeleton } from '@/components/ui/skeleton'
import { PostGridSkeleton } from '@/components/shared/post-card-skeleton'

export default function ProfileLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-16 rounded-full" />
          ))}
        </div>
      </div>
      <Skeleton className="h-10 w-56" />
      <PostGridSkeleton count={4} />
    </div>
  )
}
