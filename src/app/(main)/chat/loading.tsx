import { Skeleton } from '@/components/ui/skeleton'

export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Sidebar skeleton */}
      <div className="flex h-full w-64 flex-shrink-0 flex-col border-r gap-2 p-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
      {/* Chat area skeleton */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex flex-col gap-3 flex-1">
          <Skeleton className="h-10 w-2/3 self-end rounded-2xl" />
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
          <Skeleton className="h-10 w-1/2 self-end rounded-2xl" />
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}
