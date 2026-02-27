/**
 * Telegram notification helpers.
 * All functions are fire-and-forget: errors are caught silently so
 * notification failures never interrupt the main request flow.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

/**
 * Send a single Telegram message to a chat ID.
 * Supports HTML formatting (bold, links, etc.).
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  if (!BOT_TOKEN || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
  } catch {
    // Silently swallow — notification failure must never break main flow
  }
}

/**
 * Broadcast a message to every team member who has a Telegram chat ID set,
 * excluding the user who triggered the event.
 */
export async function broadcastTelegram(excludeUserId: string, text: string): Promise<void> {
  if (!BOT_TOKEN) return
  const { createSupabaseAdmin } = await import('@/lib/supabase/admin')
  const admin = createSupabaseAdmin()

  const { data } = await admin
    .from('profiles')
    .select('telegram_chat_id')
    .neq('id', excludeUserId)
    .not('telegram_chat_id', 'is', null)

  if (!data?.length) return

  const chatIds = (data as unknown as Array<{ telegram_chat_id: string | null }>)
    .map((p) => p.telegram_chat_id)
    .filter((id): id is string => id !== null)

  await Promise.all(chatIds.map((id) => sendTelegramMessage(id, text)))
}
