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
}

export interface TopPost {
  id: string
  title: string
  type: string
  votes_count: number
  saves_count: number
  status: string
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
      .select('id, title, type, status, votes_count, saves_count'),
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

  return { totals, byStatus, byType, byCategory, topByVotes, topBySaves }
}
