'use server'

import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { createSupabaseServer } from '@/lib/supabase/server'
import { generateEmbedding, getEmbeddingConfig } from '@/lib/embeddings'
import type { EmbeddingConfig } from '@/lib/embeddings'
import type { ActionResult } from '@/types'

async function verifyAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role === 'admin'
}

export async function saveEmbeddingSettings(
  config: EmbeddingConfig
): Promise<ActionResult> {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) return { success: false, error: 'Not authorized.' }

  const admin = createSupabaseAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { error } = await db
    .from('app_settings')
    .upsert({
      key:        'embedding_config',
      value:      config,
      updated_at: new Date().toISOString(),
    })

  if (error) return { success: false, error: 'Failed to save settings.' }
  return { success: true, data: undefined }
}

export async function testEmbeddingSettings(
  config: EmbeddingConfig
): Promise<ActionResult> {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) return { success: false, error: 'Not authorized.' }

  try {
    const embedding = await generateEmbedding('hello world', config)
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return { success: false, error: 'Unexpected response from embedding API.' }
    }
    return { success: true, data: undefined }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Embedding test failed.',
    }
  }
}

export { getEmbeddingConfig }
