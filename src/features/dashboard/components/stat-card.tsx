interface StatCardProps {
  label: string
  value: number | string
  sub?: string
  accent?: string   // Tailwind text-color class for the value
}

export function StatCard({ label, value, sub, accent = 'text-foreground' }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
