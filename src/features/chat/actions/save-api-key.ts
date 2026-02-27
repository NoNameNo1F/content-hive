'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import { encrypt } from '@/lib/encryption'
import type { LLMProvider } from '@/lib/llm'
import type { ActionResult } from '@/types'

export async function saveApiKey(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const provider = formData.get('provider') as LLMProvider
  const rawKey = (formData.get('apiKey') as string)?.trim()

  if (!provider || !rawKey) {
    return { success: false, error: 'Provider and API key are required.' }
  }

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  let encryptedKey: string
  try {
    encryptedKey = encrypt(rawKey)
  } catch {
    return { success: false, error: 'Encryption not configured. Set ENCRYPTION_KEY env var.' }
  }

  // Tables not yet in generated types — cast until next `supabase gen types`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createSupabaseAdmin() as any
  const { error } = await adminDb.from('user_api_keys').upsert(
    { user_id: user.id, provider, encrypted_key: encryptedKey, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,provider' }
  )

  if (error) return { success: false, error: 'Failed to save API key.' }

  revalidatePath('/chat')
  return { success: true, data: undefined }
}

export async function deleteApiKey(provider: LLMProvider): Promise<void> {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createSupabaseAdmin() as any
  await adminDb.from('user_api_keys').delete().eq('user_id', user.id).eq('provider', provider)

  revalidatePath('/chat')
}
