import { createSupabaseServer } from '@/lib/supabase/server'

export interface SaveList {
  id: string
  name: string
  created_at: string
  item_count: number
}

export async function getUserLists(userId: string): Promise<SaveList[]> {
  const supabase = await createSupabaseServer()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: lists } = await db
    .from('save_lists')
    .select('id, name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!lists || lists.length === 0) return []

  const listIds = (lists as Array<{ id: string; name: string; created_at: string }>).map((l) => l.id)
  const { data: items } = await db
    .from('save_list_items')
    .select('list_id')
    .in('list_id', listIds)

  const countMap: Record<string, number> = {}
  for (const item of (items ?? []) as Array<{ list_id: string }>) {
    countMap[item.list_id] = (countMap[item.list_id] ?? 0) + 1
  }

  return (lists as Array<{ id: string; name: string; created_at: string }>).map((l) => ({
    ...l,
    item_count: countMap[l.id] ?? 0,
  }))
}
