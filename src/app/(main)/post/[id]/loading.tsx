import { Skeleton } from '@/components/ui/skeleton'

export default function PostLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-3/4" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <Skeleton className="aspect-video w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-16 rounded-full" />
        ))}
      </div>
    </div>
  )
}
