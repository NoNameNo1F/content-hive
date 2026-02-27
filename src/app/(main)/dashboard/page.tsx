import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getDashboardStats } from '@/features/dashboard/queries/get-dashboard-stats'
import { StatCard } from '@/features/dashboard/components/stat-card'
import { BarChartCard } from '@/features/dashboard/components/bar-chart-card'
import { TopPostsTable } from '@/features/dashboard/components/top-posts-table'

export const metadata = { title: 'Dashboard — ContentHive' }

// Category colours matching the graph page
const CAT_COLORS: Record<string, string> = {
  'Personal Storytelling': '#7c3aed',
  'Collections':           '#2563eb',
  'Comparison':            '#d97706',
  'Fact-Check':            '#dc2626',
  'Tutorial':              '#16a34a',
  'Product & Brand Story': '#0891b2',
}

const STATUS_COLORS: Record<string, string> = {
  available: '#16a34a',
  in_use:    '#d97706',
  used:      '#2563eb',
  rejected:  '#dc2626',
}

const TYPE_COLORS: Record<string, string> = {
  video: '#7c3aed',
  link:  '#0891b2',
  text:  '#6b7280',
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  in_use:    'In use',
  used:      'Used',
  rejected:  'Rejected',
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const stats = await getDashboardStats()
  const { totals, byStatus, byType, byCategory, topByVotes, topBySaves } = stats

  const statusChartData = byStatus.map((s) => ({
    name:  STATUS_LABELS[s.status] ?? s.status,
    count: s.count,
    color: STATUS_COLORS[s.status],
  }))

  const typeChartData = byType.map((t) => ({
    name:  t.type.charAt(0).toUpperCase() + t.type.slice(1),
    count: t.count,
    color: TYPE_COLORS[t.type],
  }))

  const categoryChartData = byCategory.map((c) => ({
    name:  c.name,
    count: c.count,
    color: CAT_COLORS[c.name],
  }))

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Content library overview — live data
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total posts"
          value={totals.posts}
          accent="text-foreground"
        />
        <StatCard
          label="Team members"
          value={totals.members}
          accent="text-violet-600 dark:text-violet-400"
        />
        <StatCard
          label="Total votes"
          value={totals.votes}
          sub="▲ upvotes cast"
          accent="text-primary"
        />
        <StatCard
          label="Total saves"
          value={totals.saves}
          sub="★ bookmarks"
          accent="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-3">
        <BarChartCard
          title="Content pipeline"
          data={statusChartData}
        />
        <BarChartCard
          title="Post types"
          data={typeChartData}
        />
        <BarChartCard
          title="By category"
          data={categoryChartData}
        />
      </div>

      {/* Top content */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TopPostsTable
          title="Top by votes"
          posts={topByVotes}
          sortKey="votes_count"
        />
        <TopPostsTable
          title="Top by saves"
          posts={topBySaves}
          sortKey="saves_count"
        />
      </div>
    </div>
  )
}
