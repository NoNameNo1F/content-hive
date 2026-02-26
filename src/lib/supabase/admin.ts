import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Supabase admin client using the service role key.
 * Bypasses RLS — use ONLY in server-side API routes, never in client code.
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
