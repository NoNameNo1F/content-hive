import { createSupabaseServer } from '@/lib/supabase/server'

export interface DashboardStats {
  totals: {
    posts: number
    saves: number
    votes: number
    members: number
  }
  byStatus: { status: string; count: number }[]
  byType:   { type: string; count: number }[]
  byCategory: { name: string; count: number }[]
  topByVotes: TopPost[]
  topBySaves: TopPost[]
  // Time-series
  byWeek:  { week: string; count: number }[]   // last 12 weeks
  byDay7:  { day: string; count: number }[]    // last 7 days (for sparklines)
  byDate:  { date: string; count: number }[]   // all-time by date (for calendar)
}

export interface TopPost {
  id: string
  title: string
  type: string
  votes_count: number
  saves_count: number
  status: string
}

// Returns "Mon 3" style label for a Date's week start
function weekLabel(d: Date): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[d.getMonth()]} ${d.getDate()}`
}

// Returns ISO date string "YYYY-MM-DD" for a Date
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// Returns start-of-week (Monday) for a given date
function startOfWeek(d: Date): Date {
  const day = d.getDay() // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createSupabaseServer()

  const [
    { data: posts },
    { data: members },
    { data: categories },
    { data: postCats },
  ] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, type, status, votes_count, saves_count, created_at'),
    supabase
      .from('profiles')
      .select('id, role')
      .in('role', ['member', 'admin']),
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase.from('post_categories').select('category_id'),
  ])

  const allPosts = posts ?? []

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totals = {
    posts:   allPosts.length,
    saves:   allPosts.reduce((s, p) => s + (p.saves_count ?? 0), 0),
    votes:   allPosts.reduce((s, p) => s + (p.votes_count ?? 0), 0),
    members: (members ?? []).length,
  }

  // ── By status ──────────────────────────────────────────────────────────────
  const statusMap = new Map<string, number>()
  for (const p of allPosts) {
    statusMap.set(p.status, (statusMap.get(p.status) ?? 0) + 1)
  }
  const STATUS_ORDER = ['available', 'in_use', 'used', 'rejected']
  const byStatus = STATUS_ORDER.map((s) => ({
    status: s,
    count: statusMap.get(s) ?? 0,
  }))

  // ── By type ────────────────────────────────────────────────────────────────
  const typeMap = new Map<string, number>()
  for (const p of allPosts) {
    typeMap.set(p.type, (typeMap.get(p.type) ?? 0) + 1)
  }
  const byType = [...typeMap.entries()].map(([type, count]) => ({ type, count }))

  // ── By category ────────────────────────────────────────────────────────────
  const catCountMap = new Map<string, number>()
  for (const pc of postCats ?? []) {
    catCountMap.set(pc.category_id, (catCountMap.get(pc.category_id) ?? 0) + 1)
  }
  const byCategory = (categories ?? []).map((cat) => ({
    name:  cat.name,
    count: catCountMap.get(cat.id) ?? 0,
  }))

  // ── Top posts ──────────────────────────────────────────────────────────────
  const sorted = [...allPosts]
  const topByVotes = sorted
    .sort((a, b) => (b.votes_count ?? 0) - (a.votes_count ?? 0))
    .slice(0, 8)
    .map((p) => ({
      id: p.id, title: p.title, type: p.type, status: p.status,
      votes_count: p.votes_count ?? 0, saves_count: p.saves_count ?? 0,
    }))

  const topBySaves = [...allPosts]
    .sort((a, b) => (b.saves_count ?? 0) - (a.saves_count ?? 0))
    .slice(0, 8)
    .map((p) => ({
      id: p.id, title: p.title, type: p.type, status: p.status,
      votes_count: p.votes_count ?? 0, saves_count: p.saves_count ?? 0,
    }))

  // ── Time-series ────────────────────────────────────────────────────────────
  const now = new Date()

  // byWeek: last 12 weeks (Monday buckets)
  const weekBuckets = new Map<string, number>()
  const weekKeys: string[] = []
  for (let i = 11; i >= 0; i--) {
    const monday = startOfWeek(new Date(now))
    monday.setDate(monday.getDate() - i * 7)
    const key = isoDate(monday)
    weekKeys.push(key)
    weekBuckets.set(key, 0)
  }
  for (const p of allPosts) {
    const d = new Date(p.created_at)
    const key = isoDate(startOfWeek(d))
    if (weekBuckets.has(key)) {
      weekBuckets.set(key, (weekBuckets.get(key) ?? 0) + 1)
    }
  }
  // Build label map: isoDate → "Jan 3" style
  const weekLabelMap = new Map<string, string>()
  for (let i = 11; i >= 0; i--) {
    const monday = startOfWeek(new Date(now))
    monday.setDate(monday.getDate() - i * 7)
    weekLabelMap.set(isoDate(monday), weekLabel(monday))
  }
  const byWeek = weekKeys.map((key) => ({
    week: weekLabelMap.get(key) ?? key,
    count: weekBuckets.get(key) ?? 0,
  }))

  // byDay7: last 7 days (for sparklines)
  const day7Buckets = new Map<string, number>()
  const day7Keys: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = isoDate(d)
    day7Keys.push(key)
    day7Buckets.set(key, 0)
  }
  for (const p of allPosts) {
    const key = isoDate(new Date(p.created_at))
    if (day7Buckets.has(key)) {
      day7Buckets.set(key, (day7Buckets.get(key) ?? 0) + 1)
    }
  }
  const byDay7 = day7Keys.map((key) => ({
    day: key,
    count: day7Buckets.get(key) ?? 0,
  }))

  // byDate: all-time by date (for calendar)
  const dateBuckets = new Map<string, number>()
  for (const p of allPosts) {
    const key = isoDate(new Date(p.created_at))
    dateBuckets.set(key, (dateBuckets.get(key) ?? 0) + 1)
  }
  const byDate = [...dateBuckets.entries()].map(([date, count]) => ({ date, count }))

  return { totals, byStatus, byType, byCategory, topByVotes, topBySaves, byWeek, byDay7, byDate }
}
