import { createSupabaseServer } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/encryption'
import { getAdapter } from '@/lib/llm'
import { AGENT_TOOLS, WRITE_TOOL_NAMES } from '@/lib/llm/tools'
import { executeTool } from '@/lib/llm/execute-tool'
import Anthropic from '@anthropic-ai/sdk'
import type { LLMProvider, ChatMessage } from '@/lib/llm'

const CLAUDE_SYSTEM =
  'You are a ContentHive assistant. Use the available tools to look up real posts, ' +
  'categories, and hashtags before answering questions about the content library. ' +
  'Never fabricate post titles, IDs, or statistics.'

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
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()

      try {
        if (provider === 'claude') {
          // ── Claude with tool calling ────────────────────────────────────
          const client = new Anthropic({ apiKey })
          type AntMsg = Anthropic.Messages.MessageParam
          let history: AntMsg[] = messages.map((m) => ({ role: m.role, content: m.content }))

          while (true) {
            const response = await client.messages.create({
              model: 'claude-sonnet-4-6',
              max_tokens: 4096,
              system: CLAUDE_SYSTEM,
              tools: AGENT_TOOLS,
              tool_choice: { type: 'auto' },
              messages: history,
            })

            if (response.stop_reason === 'tool_use') {
              const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []
              for (const block of response.content) {
                if (block.type !== 'tool_use') continue
                controller.enqueue(
                  enc.encode(`data: ${JSON.stringify({ toolCall: { name: block.name } })}\n\n`)
                )
                const result = await executeTool(block.name, block.input as Record<string, unknown>)

                // Emit write proposal card for write tools
                if (WRITE_TOOL_NAMES.has(block.name)) {
                  try {
                    const parsed = JSON.parse(result) as Record<string, unknown>
                    if (parsed.confirmationId) {
                      controller.enqueue(
                        enc.encode(`data: ${JSON.stringify({
                          writeProposal: {
                            confirmationId: parsed.confirmationId,
                            toolName: block.name,
                            proposal: parsed.proposal,
                          },
                        })}\n\n`)
                      )
                    }
                  } catch { /* ignore parse errors */ }
                }

                toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
              }
              history = [
                ...history,
                { role: 'assistant', content: response.content },
                { role: 'user', content: toolResults },
              ]
              continue
            }

            // Final text response — stream it
            const textBlocks = response.content.filter(
              (b) => b.type === 'text'
            ) as Anthropic.Messages.TextBlock[]
            const text = textBlocks.map((b) => b.text).join('')

            // Yield in chunks to simulate streaming
            const CHUNK = 20
            for (let i = 0; i < text.length; i += CHUNK) {
              const chunk = text.slice(i, i + CHUNK)
              fullResponse += chunk
              controller.enqueue(enc.encode(`data: ${JSON.stringify({ chunk })}\n\n`))
            }
            break
          }
        } else {
          // ── Other providers — simple streaming ──────────────────────────
          const adapter = getAdapter(provider)
          for await (const chunk of adapter.stream(messages, apiKey)) {
            fullResponse += chunk
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ chunk })}\n\n`))
          }
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
