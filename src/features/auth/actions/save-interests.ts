'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { MIN_INTEREST_TAGS, MAX_INTEREST_TAGS } from '@/lib/constants'
import type { ActionResult } from '@/types'

export async function saveInterests(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const tags = formData.getAll('tags') as string[]

  if (tags.length < MIN_INTEREST_TAGS) {
    return { success: false, error: `Please select at least ${MIN_INTEREST_TAGS} interests.` }
  }

  if (tags.length > MAX_INTEREST_TAGS) {
    return { success: false, error: `Please select no more than ${MAX_INTEREST_TAGS} interests.` }
  }

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'You must be logged in.' }
  }

  // Replace all existing interests atomically
  const { error: deleteError } = await supabase
    .from('user_interests')
    .delete()
    .eq('user_id', user.id)

  if (deleteError) {
    return { success: false, error: 'Failed to save interests. Please try again.' }
  }

  const rows = tags.map((tag) => ({ user_id: user.id, tag }))
  const { error: insertError } = await supabase.from('user_interests').insert(rows)

  if (insertError) {
    return { success: false, error: 'Failed to save interests. Please try again.' }
  }

  redirect('/onboarding/tour')
}
