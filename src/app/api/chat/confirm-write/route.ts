import { createSupabaseServer } from '@/lib/supabase/server'

interface ConfirmWriteBody {
  confirmationId: string
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let confirmationId: string
  try {
    const body = (await req.json()) as ConfirmWriteBody
    confirmationId = body.confirmationId
    if (!confirmationId) throw new Error('invalid')
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Fetch the pending confirmation (owner check via RLS)
  const { data: conf } = await db
    .from('write_confirmations')
    .select('id, tool_name, payload, expires_at, executed_at')
    .eq('id', confirmationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!conf) {
    return new Response(JSON.stringify({ error: 'Confirmation not found' }), { status: 404 })
  }

  const confirmation = conf as {
    id: string
    tool_name: string
    payload: Record<string, unknown>
    expires_at: string
    executed_at: string | null
  }

  if (confirmation.executed_at) {
    return new Response(JSON.stringify({ error: 'Already executed' }), { status: 409 })
  }

  if (new Date(confirmation.expires_at) < new Date()) {
    return new Response(JSON.stringify({ error: 'Confirmation expired' }), { status: 410 })
  }

  // Execute the write
  let postId: string | undefined
  const payload = confirmation.payload

  if (confirmation.tool_name === 'create_post') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error } = await (supabase as any)
      .from('posts')
      .insert({
        user_id: user.id,
        type: String(payload.type ?? 'video'),
        title: String(payload.title ?? ''),
        description: payload.description ? String(payload.description) : undefined,
        url: payload.url ? String(payload.url) : undefined,
        creator_handle: payload.creator_handle ? String(payload.creator_handle) : undefined,
        visibility: 'public',
        status: 'available',
      })
      .select('id')
      .single()

    if (error || !post) {
      return new Response(JSON.stringify({ error: 'Failed to create post' }), { status: 500 })
    }
    postId = post.id
  } else if (confirmation.tool_name === 'update_post_status') {
    const { error } = await supabase
      .from('posts')
      .update({ status: String(payload.status) as 'available' | 'unavailable' })
      .eq('id', String(payload.post_id))
      .eq('user_id', user.id)

    if (error) {
      return new Response(JSON.stringify({ error: 'Failed to update post' }), { status: 500 })
    }
  } else {
    return new Response(JSON.stringify({ error: 'Unknown tool' }), { status: 400 })
  }

  // Mark as executed
  await db
    .from('write_confirmations')
    .update({ executed_at: new Date().toISOString() })
    .eq('id', confirmationId)

  return new Response(JSON.stringify({ success: true, postId }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
