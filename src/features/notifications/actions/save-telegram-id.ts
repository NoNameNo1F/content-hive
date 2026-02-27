'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export async function saveTelegramId(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const chatId = (formData.get('telegramChatId') as string)?.trim() || null

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('profiles')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ telegram_chat_id: chatId } as any)
    .eq('id', user.id)

  if (error) return { success: false, error: 'Failed to save notification settings.' }

  revalidatePath(`/profile/${user.id}`)
  return { success: true, data: undefined }
}
