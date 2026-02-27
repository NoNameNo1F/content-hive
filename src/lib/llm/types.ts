export type LLMProvider = 'claude' | 'gpt' | 'gemini' | 'grok' | 'deepseek' | 'qwen'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** A streaming LLM adapter. Yields text chunks as they arrive. */
export interface LLMAdapter {
  stream(messages: ChatMessage[], apiKey: string): AsyncIterable<string>
}

export const PROVIDER_META: Record<
  LLMProvider,
  { label: string; placeholder: string; defaultModel: string; baseUrl?: string }
> = {
  claude: {
    label: 'Claude',
    placeholder: 'sk-ant-...',
    defaultModel: 'claude-sonnet-4-6',
  },
  gpt: {
    label: 'ChatGPT',
    placeholder: 'sk-...',
    defaultModel: 'gpt-4o',
  },
  gemini: {
    label: 'Gemini',
    placeholder: 'AIza...',
    defaultModel: 'gemini-2.0-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  },
  grok: {
    label: 'Grok',
    placeholder: 'xai-...',
    defaultModel: 'grok-2-1212',
    baseUrl: 'https://api.x.ai/v1',
  },
  deepseek: {
    label: 'DeepSeek',
    placeholder: 'sk-...',
    defaultModel: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com',
  },
  qwen: {
    label: 'Qwen',
    placeholder: 'sk-...',
    defaultModel: 'qwen-max',
    baseUrl: 'https://dashscope-compatible-openai.aliyuncs.com/compatible-mode/v1',
  },
}
