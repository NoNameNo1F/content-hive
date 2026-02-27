'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { LLMProvider } from '@/lib/llm'

export async function createConversation(formData: FormData) {
  const provider = formData.get('provider') as LLMProvider

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Tables not yet in generated types — cast until next `supabase gen types`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data, error } = await db
    .from('conversations')
    .insert({ user_id: user.id, provider })
    .select('id')
    .single()

  if (error || !data) redirect('/chat')

  const { id } = data as { id: string }
  redirect(`/chat/${id}`)
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  // Messages cascade-delete via FK
  await db.from('conversations').delete().eq('id', conversationId).eq('user_id', user.id)
}
