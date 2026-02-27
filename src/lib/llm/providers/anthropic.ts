import Anthropic from '@anthropic-ai/sdk'
import type { LLMAdapter, ChatMessage } from '@/lib/llm/types'

export const anthropicAdapter: LLMAdapter = {
  async *stream(messages: ChatMessage[], apiKey: string) {
    const client = new Anthropic({ apiKey })

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text
      }
    }
  },
}
