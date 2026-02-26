import { createSupabaseServer } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

/**
 * Returns the role of the currently authenticated user.
 * Returns 'visitor' if the user is not authenticated.
 */
export async function getUserRole(): Promise<UserRole | 'visitor'> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return 'visitor'

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return data?.role ?? 'member'
}
