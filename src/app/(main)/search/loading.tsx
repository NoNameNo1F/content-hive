import { PostGridSkeleton } from '@/components/shared/post-card-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function SearchLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-16 rounded-full" />
            ))}
          </div>
        </div>
        <PostGridSkeleton count={4} />
      </div>
    </div>
  )
}
