export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-36 rounded bg-muted" />
        <div className="h-4 w-56 rounded bg-muted" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-2">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-40 rounded bg-muted" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-44 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b">
              <div className="h-4 w-28 rounded bg-muted" />
            </div>
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 px-5 py-3">
                <div className="h-3 w-4 rounded bg-muted" />
                <div className="h-3 flex-1 rounded bg-muted" />
                <div className="h-4 w-20 rounded bg-muted" />
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Calendar */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-36 rounded bg-muted" />
          <div className="h-6 w-32 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded bg-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}
