import { createSupabaseAdmin } from '@/lib/supabase/admin'

export type EmbeddingProvider = 'openai' | 'voyage'

export interface EmbeddingConfig {
  provider: EmbeddingProvider
  model:    string
  apiKey:   string
}

/**
 * Read the embedding config from app_settings using the admin client (bypasses RLS).
 * Returns null if not configured.
 */
export async function getEmbeddingConfig(): Promise<EmbeddingConfig | null> {
  try {
    const admin = createSupabaseAdmin()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any
    const { data } = await db
      .from('app_settings')
      .select('value')
      .eq('key', 'embedding_config')
      .single()
    if (!data?.value) return null
    return data.value as EmbeddingConfig
  } catch {
    return null
  }
}

/**
 * Generate an embedding vector for the given text using the configured provider.
 */
export async function generateEmbedding(
  text:   string,
  config: EmbeddingConfig
): Promise<number[]> {
  if (config.provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text, model: config.model }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`OpenAI embeddings failed (${res.status}): ${body}`)
    }
    const json = await res.json()
    return json.data[0].embedding as number[]
  }

  if (config.provider === 'voyage') {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: [text], model: config.model }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Voyage embeddings failed (${res.status}): ${body}`)
    }
    const json = await res.json()
    return json.data[0].embedding as number[]
  }

  throw new Error(`Unknown embedding provider: ${config.provider}`)
}
