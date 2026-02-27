import { createSupabaseServer } from '@/lib/supabase/server'

/**
 * Returns a map of postId → vote direction (1 or -1) for the given user.
 * Only includes posts the user has voted on.
 */
export async function getUserVotes(
  userId: string,
  postIds: string[]
): Promise<Record<string, 1 | -1>> {
  if (postIds.length === 0) return {}

  const supabase = await createSupabaseServer()
  // post_votes not in generated types yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data } = await db
    .from('post_votes')
    .select('post_id, direction')
    .eq('user_id', userId)
    .in('post_id', postIds)

  const result: Record<string, 1 | -1> = {}
  for (const row of (data ?? []) as Array<{ post_id: string; direction: number }>) {
    result[row.post_id] = row.direction as 1 | -1
  }
  return result
}
