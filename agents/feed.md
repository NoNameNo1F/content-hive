# agent-feed — Feed Agent

## Read First
- `architecture/db-schema.sql`
- `agents/skills/code-standards.md`

## Gate
⛔ Do not start until agent-qa has signed off on RLS.

## Responsibility
Feed shows the right content to the right user. Public visitors see public posts. Members see interest-matched content.

## Outputs

### 1. Feed Query — `src/features/feed/queries/get-feed-posts.ts`

Two variants — one function, branching on auth state:

```typescript
export async function getFeedPosts({
  userId,
  page = 0,
  sortBy = 'recent'  // 'recent' | 'popular'
}: FeedParams): Promise<Post[]> {
  const supabase = createSupabaseServer()
  const pageSize = 20
  const from = page * pageSize
  const to = from + pageSize - 1

  // Base query
  let query = supabase
    .from('posts')
    .select(`*, profiles(username, avatar_url), post_tags(tag)`)
    .range(from, to)

  // Sort
  if (sortBy === 'popular') {
    query = query.order('bookmark_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  // Authenticated: filter by interests
  if (userId) {
    const { data: interests } = await supabase
      .from('user_interests').select('tag').eq('user_id', userId)
    const tags = interests?.map(i => i.tag) ?? []

    if (tags.length > 0) {
      // Get post IDs matching interest tags
      const { data: matchedIds } = await supabase
        .from('post_tags').select('post_id').in('tag', tags)
      const ids = matchedIds?.map(m => m.post_id) ?? []
      query = query.in('id', ids)
    }
    // RLS handles visibility (public + team for authenticated)
  } else {
    // Public only — RLS enforces this, but be explicit
    query = query.eq('visibility', 'public')
  }

  const { data, error } = await query
  if (error) throw new Error(`getFeedPosts: ${error.message}`)
  return data ?? []
}
```

### 2. Feed Page — `src/app/(main)/feed/page.tsx`
Server component. Pass data to client feed list.

### 3. Feed List — `src/features/feed/components/feed-list.tsx`
Client component. Uses `PostCard` from shared components.
Includes sort toggle (Recent / Popular) — on change, re-fetch with new sort param.

### 4. Pagination
Use offset pagination for V1 (simple):
```typescript
// Feed page has Load More button
// Fetches next page, appends to existing list
// Stop showing button when returned posts < pageSize
```

### 5. Public Feed
`src/app/page.tsx` — root page, no auth required.
Same query as feed but forces `visibility = 'public'` and no interest filtering.
Shows call-to-action to sign up.

## Done When
- [ ] Authenticated user sees posts matching their interest tags
- [ ] Unauthenticated visitor sees public posts only (verify no team posts appear)
- [ ] Sort by Recent and Popular both work
- [ ] Load More loads next page without full page refresh
- [ ] Empty state shown when no matching posts
- [ ] Public homepage renders without login
