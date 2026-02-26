# agent-search — Search Agent

## Read First
- `architecture/db-schema.sql`
- `agents/skills/code-standards.md`

## Gate
⛔ Do not start until agent-qa has signed off on RLS.

## Responsibility
Search is fast, relevant, and respects visibility rules.

## Outputs

### 1. FTS Migration — add to `supabase/migrations/009_fts.sql`
```sql
-- Add tsvector column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS fts tsvector;

-- Populate from title + description
UPDATE posts SET fts = to_tsvector('english', 
  coalesce(title, '') || ' ' || coalesce(description, ''));

-- GIN index for performance
CREATE INDEX posts_fts_idx ON posts USING GIN(fts);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_post_fts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts := to_tsvector('english',
    coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_fts_update
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_post_fts();
```

### 2. Search Query — `src/features/search/queries/search-posts.ts`
```typescript
export async function searchPosts({
  q, tags, categoryId, page = 0
}: SearchParams): Promise<{ posts: Post[]; total: number }> {
  const supabase = createSupabaseServer()  // session-aware → RLS auto-applies
  const pageSize = 20

  let query = supabase
    .from('posts')
    .select(`*, profiles(username, avatar_url), post_tags(tag)`, { count: 'exact' })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (q) query = query.textSearch('fts', q, { type: 'websearch' })
  if (categoryId) query = query.eq('category_id', categoryId)
  // Tag filter via junction — if tags provided, filter post IDs
  if (tags?.length) {
    const { data: ids } = await supabase
      .from('post_tags').select('post_id').in('tag', tags)
    query = query.in('id', ids?.map(r => r.post_id) ?? [])
  }

  const { data, error, count } = await query
  if (error) throw new Error(`searchPosts: ${error.message}`)
  return { posts: data ?? [], total: count ?? 0 }
}
```

Note: RLS on `posts` table means team posts only appear for authenticated users automatically.

### 3. Search API Route — `src/app/api/search/route.ts`
Thin wrapper around `searchPosts()`. Parses query params, returns JSON.

### 4. Search UI — `src/features/search/components/`
```
search/
├── components/
│   ├── search-bar.tsx         # Debounced input (300ms), controlled
│   ├── search-filters.tsx     # Tag chips + category dropdown
│   └── search-results.tsx     # Results list using PostCard
└── queries/
    └── search-posts.ts
```

Search bar behavior:
- Debounce 300ms before triggering search
- Push query to URL (`?q=...`) for shareable search URLs
- Show result count above list

## Done When
- [ ] FTS migration runs without error, trigger fires on insert
- [ ] Search returns results for title and description matches
- [ ] Tag filter narrows results correctly
- [ ] Authenticated user search includes team posts; visitor search does not
- [ ] Empty results state shown with helpful message
- [ ] Search URL is shareable (query in URL params)
