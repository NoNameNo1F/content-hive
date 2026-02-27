export default function GraphLoading() {
  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 8rem)' }}>
      <div className="space-y-1 shrink-0">
        <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-80 rounded-md bg-muted animate-pulse" />
      </div>
      <div className="flex-1 rounded-xl border bg-muted animate-pulse" />
    </div>
  )
}
