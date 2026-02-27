'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

interface VoteResult {
  votesCount: number
  userVote: 1 | -1 | null
}

/**
 * Toggles a vote on a post for the current user.
 * - Same direction  → removes the vote (toggle off)
 * - New direction   → inserts the vote
 * - Flip direction  → updates to opposite
 */
export async function toggleVote(
  postId: string,
  direction: 1 | -1
): Promise<ActionResult<VoteResult>> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  // post_votes not in generated types yet — cast until next supabase gen types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: existing } = await db
    .from('post_votes')
    .select('direction')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle()

  if (existing) {
    if (existing.direction === direction) {
      // Same direction — remove vote (toggle off)
      await db.from('post_votes').delete().eq('user_id', user.id).eq('post_id', postId)
    } else {
      // Opposite direction — flip
      await db
        .from('post_votes')
        .update({ direction })
        .eq('user_id', user.id)
        .eq('post_id', postId)
    }
  } else {
    // No existing vote — insert
    await db.from('post_votes').insert({ user_id: user.id, post_id: postId, direction })
  }

  // Read back the current state
  const { data: post } = await supabase
    .from('posts')
    .select('votes_count')
    .eq('id', postId)
    .single()

  const { data: currentVote } = await db
    .from('post_votes')
    .select('direction')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle()

  return {
    success: true,
    data: {
      votesCount: (post?.votes_count as number) ?? 0,
      userVote: (currentVote?.direction as 1 | -1 | null) ?? null,
    },
  }
}
