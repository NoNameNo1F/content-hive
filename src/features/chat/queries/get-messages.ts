import { createSupabaseServer } from '@/lib/supabase/server'
import type { LLMProvider } from '@/lib/llm'

export interface ConversationWithMessages {
  id: string
  provider: LLMProvider
  title: string
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; createdAt: string }>
}

export async function getConversationWithMessages(
  conversationId: string
): Promise<ConversationWithMessages | null> {
  const supabase = await createSupabaseServer()
  // Tables not yet in generated types — cast until next `supabase gen types`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: conv } = await db
    .from('conversations')
    .select('id, provider, title')
    .eq('id', conversationId)
    .single()

  if (!conv) return null

  const { data: msgs } = await db
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const row = conv as { id: string; provider: string; title: string }

  return {
    id: row.id,
    provider: row.provider as LLMProvider,
    title: row.title,
    messages: ((msgs ?? []) as Array<{ id: string; role: string; content: string; created_at: string }>).map(
      (m) => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content, createdAt: m.created_at })
    ),
  }
}
