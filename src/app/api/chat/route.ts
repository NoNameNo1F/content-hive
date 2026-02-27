import { createSupabaseServer } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/encryption'
import { getAdapter } from '@/lib/llm'
import type { LLMProvider, ChatMessage } from '@/lib/llm'

export async function POST(req: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServer()
  // Tables added in migration 20260227030000 are not yet in generated types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const admin = createSupabaseAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = admin as any

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // ── Parse request ─────────────────────────────────────────────────────────
  let conversationId: string, content: string
  try {
    const body = await req.json()
    conversationId = body.conversationId
    content = body.content
    if (!conversationId || !content?.trim()) throw new Error('invalid')
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 })
  }

  // ── Verify conversation belongs to user + get provider ────────────────────
  const { data: conv } = await db
    .from('conversations')
    .select('provider, title')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!conv) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 })
  }

  const provider = (conv as { provider: string; title: string }).provider as LLMProvider
  const convTitle = (conv as { provider: string; title: string }).title

  // ── Decrypt API key ───────────────────────────────────────────────────────
  const { data: keyRow } = await adminDb
    .from('user_api_keys')
    .select('encrypted_key')
    .eq('user_id', user.id)
    .eq('provider', provider)
    .single()

  if (!keyRow) {
    return new Response(JSON.stringify({ error: `No API key saved for ${provider}` }), {
      status: 400,
    })
  }

  let apiKey: string
  try {
    apiKey = decrypt((keyRow as { encrypted_key: string }).encrypted_key)
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to decrypt API key' }), { status: 500 })
  }

  // ── Save user message ─────────────────────────────────────────────────────
  await db.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: content.trim(),
  })

  // ── Auto-title from first message ─────────────────────────────────────────
  if (convTitle === 'New conversation') {
    const title = content.trim().slice(0, 60) + (content.trim().length > 60 ? '…' : '')
    await db.from('conversations').update({ title }).eq('id', conversationId)
  }

  // ── Load conversation history ─────────────────────────────────────────────
  const { data: history } = await db
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const messages: ChatMessage[] = ((history ?? []) as Array<{ role: string; content: string }>).map(
    (m) => ({ role: m.role as 'user' | 'assistant', content: m.content })
  )

  // ── Stream response ───────────────────────────────────────────────────────
  const adapter = getAdapter(provider)
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      try {
        for await (const chunk of adapter.stream(messages, apiKey)) {
          fullResponse += chunk
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ chunk })}\n\n`))
        }
        controller.enqueue(enc.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'LLM error'
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
        controller.close()
        return
      }

      // Save assistant message after stream closes
      await db.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: fullResponse,
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
