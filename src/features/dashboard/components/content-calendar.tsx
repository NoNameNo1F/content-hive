'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ContentCalendarProps {
  byDate: { date: string; count: number }[]
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function ContentCalendar({ byDate }: ContentCalendarProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const dateMap = new Map(byDate.map((d) => [d.date, d.count]))

  // First day of this month
  const firstDay = new Date(year, month, 1)
  // Day of week for first (0=Sun → convert to Mon=0)
  const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

  // Total days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Build grid: leading empty cells + day cells
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete final row
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const todayStr = isoDate(today)

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Content calendar</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={prevMonth} className="h-7 w-7 p-0">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs font-medium w-28 text-center">
            {MONTHS[month]} {year}
          </span>
          <Button variant="ghost" size="sm" onClick={nextMonth} className="h-7 w-7 p-0">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const count = dateMap.get(dateStr) ?? 0
          const isToday = dateStr === todayStr

          return (
            <div
              key={dateStr}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded text-xs transition-colors',
                isToday && 'ring-1 ring-primary',
                count > 0 ? 'bg-primary/15 text-primary font-semibold' : 'text-muted-foreground hover:bg-accent/30',
              )}
              title={count > 0 ? `${count} post${count > 1 ? 's' : ''}` : undefined}
            >
              <span>{day}</span>
              {count > 0 && (
                <span className="text-[9px] leading-none mt-0.5 tabular-nums">{count}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-primary/15" />
          <span>Has content</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded ring-1 ring-primary" />
          <span>Today</span>
        </div>
      </div>
    </div>
  )
}
