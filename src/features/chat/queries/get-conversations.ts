import { createSupabaseServer } from '@/lib/supabase/server'
import type { LLMProvider } from '@/lib/llm'

export interface ConversationSummary {
  id: string
  provider: LLMProvider
  title: string
  updatedAt: string
}

export async function getConversations(): Promise<ConversationSummary[]> {
  const supabase = await createSupabaseServer()
  // Tables not yet in generated types — cast until next `supabase gen types`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data } = await db
    .from('conversations')
    .select('id, provider, title, updated_at')
    .order('updated_at', { ascending: false })
    .limit(50)

  return ((data ?? []) as Array<{ id: string; provider: string; title: string; updated_at: string }>).map(
    (c) => ({ id: c.id, provider: c.provider as LLMProvider, title: c.title, updatedAt: c.updated_at })
  )
}
