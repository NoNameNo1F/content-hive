'use client'

export default function FeedError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-16 text-center">
      <p className="text-sm text-muted-foreground">Failed to load feed.</p>
      <button
        onClick={reset}
        className="text-sm font-medium underline underline-offset-4"
      >
        Try again
      </button>
    </div>
  )
}
