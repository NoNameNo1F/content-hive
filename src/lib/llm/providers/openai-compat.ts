/**
 * OpenAI-compatible adapter — covers GPT, Gemini, Grok, DeepSeek, and Qwen.
 * All these providers expose an OpenAI-compatible chat completions API.
 */
import OpenAI from 'openai'
import type { LLMAdapter, ChatMessage } from '@/lib/llm/types'
import { PROVIDER_META } from '@/lib/llm/types'
import type { LLMProvider } from '@/lib/llm/types'

export function openaiCompatAdapter(provider: Exclude<LLMProvider, 'claude'>): LLMAdapter {
  const meta = PROVIDER_META[provider]
  return {
    async *stream(messages: ChatMessage[], apiKey: string) {
      const client = new OpenAI({
        apiKey,
        baseURL: meta.baseUrl,
      })

      const stream = await client.chat.completions.create({
        model: meta.defaultModel,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      })

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content
        if (text) yield text
      }
    },
  }
}
