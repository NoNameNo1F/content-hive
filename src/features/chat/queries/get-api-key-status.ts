/**
 * Returns which providers the current user has saved API keys for.
 * Returns only a boolean Set per provider — NEVER the encrypted or decrypted key.
 */
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { LLMProvider } from '@/lib/llm'

export async function getApiKeyStatus(): Promise<Set<LLMProvider>> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Set()

  // Tables not yet in generated types — cast until next `supabase gen types`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createSupabaseAdmin() as any
  const { data } = await adminDb
    .from('user_api_keys')
    .select('provider')
    .eq('user_id', user.id)

  return new Set(
    ((data ?? []) as Array<{ provider: string }>).map((r) => r.provider as LLMProvider)
  )
}
