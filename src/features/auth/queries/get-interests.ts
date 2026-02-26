import { createSupabaseServer } from '@/lib/supabase/server'

/** Returns the interest tags the current user has selected. Empty array if none. */
export async function getUserInterests(): Promise<string[]> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('user_interests')
    .select('tag')
    .eq('user_id', user.id)

  if (error) throw new Error(`getUserInterests: ${error.message}`)

  return data.map((row) => row.tag)
}
