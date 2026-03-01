import { createSupabaseServer } from '@/lib/supabase/server'

/** Executes a read-only tool call and returns a JSON string result. */
export async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  const supabase = await createSupabaseServer()

  try {
    if (name === 'search_posts') {
      const query  = String(input.query ?? '')
      const limit  = Math.min(Number(input.limit ?? 5), 20)
      const { data } = await supabase
        .from('posts')
        .select('id, title, type, status, saves_count, creator_handle, created_at')
        .textSearch('search_vector', query, { type: 'websearch' })
        .eq('visibility', 'public')
        .limit(limit)
      return JSON.stringify(data ?? [])
    }

    if (name === 'get_post') {
      const id = String(input.id ?? '')
      const { data } = await supabase
        .from('posts')
        .select('id, title, type, status, description, saves_count, votes_count, creator_handle, url, created_at, post_tags(tag), post_categories(categories(name, slug))')
        .eq('id', id)
        .eq('visibility', 'public')
        .maybeSingle()
      return data ? JSON.stringify(data) : JSON.stringify({ error: 'Post not found' })
    }

    if (name === 'list_categories') {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name')
      const { data: counts } = await supabase
        .from('post_categories')
        .select('category_id')
      const countMap: Record<string, number> = {}
      for (const row of (counts ?? []) as Array<{ category_id: string }>) {
        countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1
      }
      const result = (categories ?? []).map((c) => ({
        ...c,
        post_count: countMap[c.id] ?? 0,
      }))
      return JSON.stringify(result)
    }

    if (name === 'list_hashtags') {
      const limit = Math.min(Number(input.limit ?? 20), 50)
      const { data } = await supabase
        .from('post_tags')
        .select('tag')
      const tagCount: Record<string, number> = {}
      for (const row of (data ?? []) as Array<{ tag: string }>) {
        tagCount[row.tag] = (tagCount[row.tag] ?? 0) + 1
      }
      const sorted = Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }))
      return JSON.stringify(sorted)
    }

    if (name === 'create_post' || name === 'update_post_status') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return JSON.stringify({ error: 'Unauthorized' })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any
      const { data, error } = await db
        .from('write_confirmations')
        .insert({
          user_id: user.id,
          tool_name: name,
          payload: input,
        })
        .select('id')
        .single()

      if (error || !data) return JSON.stringify({ error: 'Failed to create confirmation' })

      return JSON.stringify({
        confirmationId: (data as { id: string }).id,
        proposal: input,
        message: 'A confirmation card has been shown to the user. Do not proceed until they confirm.',
      })
    }

    return JSON.stringify({ error: `Unknown tool: ${name}` })
  } catch (err) {
    return JSON.stringify({ error: err instanceof Error ? err.message : 'Tool execution failed' })
  }
}
