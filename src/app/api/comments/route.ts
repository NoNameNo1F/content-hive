import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('postId')
  if (!postId) {
    return new Response(JSON.stringify({ error: 'postId required' }), { status: 400 })
  }

  const supabase = await createSupabaseServer()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data, error } = await db
    .from('comments')
    .select('id, post_id, user_id, parent_id, content, created_at, profiles:user_id(username, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify(data ?? []), {
    headers: { 'Content-Type': 'application/json' },
  })
}
