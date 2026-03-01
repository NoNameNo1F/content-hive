import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('postId')
  if (!postId) {
    return new Response(JSON.stringify({ error: 'postId required' }), { status: 400 })
  }

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ lists: [], membership: [] }))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: lists } = await db
    .from('save_lists')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const listIds = ((lists ?? []) as Array<{ id: string }>).map((l) => l.id)
  let membership: string[] = []

  if (listIds.length > 0) {
    const { data: items } = await db
      .from('save_list_items')
      .select('list_id')
      .eq('post_id', postId)
      .in('list_id', listIds)
    membership = ((items ?? []) as Array<{ list_id: string }>).map((i) => i.list_id)
  }

  return new Response(
    JSON.stringify({ lists: lists ?? [], membership }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
