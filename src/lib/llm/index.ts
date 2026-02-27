import type { LLMProvider, LLMAdapter } from './types'
import { anthropicAdapter } from './providers/anthropic'
import { openaiCompatAdapter } from './providers/openai-compat'

export function getAdapter(provider: LLMProvider): LLMAdapter {
  if (provider === 'claude') return anthropicAdapter
  return openaiCompatAdapter(provider)
}

export type { LLMProvider, LLMAdapter, ChatMessage } from './types'
export { PROVIDER_META } from './types'
