'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'

interface DataPoint {
  name: string
  count: number
  color?: string
}

interface BarChartCardProps {
  title: string
  data: DataPoint[]
  defaultColor?: string
}

const DEFAULT_COLOR = 'hsl(var(--primary))'

function ChartTooltip({ active, payload, label }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="text-muted-foreground">
          {p.name}: <span className="text-foreground font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function BarChartCard({ title, data, defaultColor = DEFAULT_COLOR }: BarChartCardProps) {
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="30%">
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, max]}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            width={24}
          />
          <Tooltip content={ChartTooltip} cursor={false} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color ?? defaultColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
